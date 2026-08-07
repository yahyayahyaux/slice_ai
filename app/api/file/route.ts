import { NextRequest, NextResponse } from "next/server";
import { existsSync, statSync, createReadStream } from "fs";
import { join, resolve } from "path";
import { getSessionUser } from "@/lib/api-auth";

const STORAGE = resolve(process.cwd(), "storage");

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p") ?? "";
  const decoded = decodeURIComponent(p);
  const abs = resolve(STORAGE, decoded.replace(/^\/?api\/file\?p=/, ""));
  // safety: ensure the resolved path stays inside storage
  if (!abs.startsWith(STORAGE + "/")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!existsSync(abs)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stat = statSync(abs);
  const ext = abs.split(".").pop()?.toLowerCase() ?? "";
  const mime: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    wav: "audio/wav",
    mp3: "audio/mpeg",
    txt: "text/plain"
  };
  const contentType = mime[ext] ?? "application/octet-stream";

  // auth: require session for video files; thumbnails are public-ish
  const user = await getSessionUser();
  const isProtectedVideo = ["mp4", "mov", "webm", "mkv"].includes(ext);
  if (isProtectedVideo && !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const stream = createReadStream(abs);
  const res = new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600"
    }
  });
  return res;
}
