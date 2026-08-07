import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";

/**
 * Presigned direct-upload endpoint.
 *
 * With S3/R2 configured (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET),
 * this returns a real presigned PUT URL so the browser uploads straight to
 * object storage. Otherwise it returns a token the app exchanges at
 * POST /api/upload (local storage), keeping the client API identical.
 */
export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { filename?: string; contentType?: string } | null;
  const filename = body?.filename ?? "video.mp4";
  const key = `uploads/${user.id}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const hasS3 = !!process.env.S3_ENDPOINT && !!process.env.S3_BUCKET && !!process.env.S3_ACCESS_KEY && !!process.env.S3_SECRET;

  if (hasS3) {
    try {
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION ?? "auto",
        credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET! },
        forcePathStyle: true
      });
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, ContentType: body?.contentType ?? "video/mp4" }),
        { expiresIn: 900 }
      );
      return ok({ url, key, method: "PUT", storage: "s3" });
    } catch (e) {
      return fail(`Could not create presigned URL: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  // Local fallback: return a single-use ticket
  return ok({ url: null, key, method: "POST", storage: "local", uploadEndpoint: "/api/upload" });
}
