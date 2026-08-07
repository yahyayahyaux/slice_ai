import { generateContentPack } from "@/lib/ai/openai";
import { PLANS } from "@/lib/config";
import { store } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { addNotificationFor, seedActivity } from "@/lib/seed-shared";
import { daysFromNow, nowIso, uid } from "@/lib/utils";
import type { Project, User } from "@/types";

export const ADMIN_EMAIL = "admin@slice.app";
export const DEMO_EMAIL = "demo@slice.app";
export const DEMO_PASSWORD = "demo1234";

const ROOT = process.cwd();
const storage = `${ROOT}/storage`;

export async function createUser(input: {
  email: string;
  name: string;
  password?: string;
  role?: "user" | "admin";
  provider?: User["provider"];
  avatar?: string;
}): Promise<User> {
  const existing = store.userByEmail(input.email);
  if (existing) return existing;
  const user: User = {
    id: uid("usr"),
    email: input.email.toLowerCase(),
    passwordHash: input.password ? await hashPassword(input.password) : undefined,
    name: input.name,
    avatar: input.avatar,
    role: input.role ?? "user",
    provider: input.provider ?? "credentials",
    emailVerified: input.role === "admin" ? true : false,
    plan: "free",
    planInterval: "monthly",
    subscriptionStatus: "none",
    cancelAtPeriodEnd: false,
    credits: PLANS.free.creditsPerCycle,
    creditsUsed: 0,
    creditsRefreshedAt: nowIso(),
    storageUsed: 0,
    usage: { projects: 0, shorts: 0, exports: 0, analysis: 0, aiText: 0, thumbnails: 0 },
    settings: { theme: "system", emailNotifications: true, pushNotifications: true },
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  store.addUser(user);
  return user;
}

export async function seedDemoData() {
  // Admin
  const admin = await createUser({ email: ADMIN_EMAIL, name: "Admin", password: "admin1234", role: "admin" });
  store.saveUser({ ...admin, emailVerified: true, plan: "enterprise", planInterval: "yearly", subscriptionStatus: "active", credits: 5000, planRenewsAt: daysFromNow(365) });

  // Demo user
  const demo = await createUser({ email: DEMO_EMAIL, name: "Demo Creator", password: DEMO_PASSWORD });
  store.saveUser({ ...demo, emailVerified: true, plan: "pro", planInterval: "monthly", subscriptionStatus: "active", credits: 96, creditsUsed: 4, planRenewsAt: daysFromNow(21), settings: { theme: "system", emailNotifications: true, pushNotifications: true } });

  // Demo project referencing the bundled sample video
  const projectId = uid("prj");
  const samplePath = `${storage}/samples/futuristic-city.mp4`;
  const project: Project = {
    id: projectId,
    userId: demo.id,
    name: "Futuristic City Reel",
    description: "AI-generated demo footage used to showcase Slice.",
    sourceType: "sample",
    fileName: "futuristic-city.mp4",
    filePath: samplePath,
    status: "ready",
    progress: 100,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  store.addProject(project);

  // Analysis
  const { analyzeVideoFile } = await import("@/lib/video/analysis");
  const analysis = await analyzeVideoFile(projectId, samplePath);
  store.addAnalysis(analysis);

  // Shorts
  const { generateShortCandidates } = await import("@/lib/ai/viral");
  const shorts = generateShortCandidates(analysis, 3, project.id).map((s) => ({ ...s, userId: demo.id }));
  for (const s of shorts) {
    store.addShort(s);
  }

  // AI content pack
  const content = generateContentPack(project.name, analysis, "Pro creator", "demo niche");
  store.saveContent({ ...content, id: uid("ctn"), projectId, userId: demo.id, generatedAt: nowIso() });

  // Invoices & notifications & activity
  store.addInvoice({
    id: uid("inv"),
    userId: demo.id,
    number: "SL-1001",
    plan: "pro",
    interval: "monthly",
    amount: 1900,
    currency: "USD",
    status: "paid",
    provider: "demo",
    cardLast4: "4242",
    periodStart: nowIso(),
    periodEnd: daysFromNow(30),
    createdAt: daysFromNow(-17),
    paidAt: daysFromNow(-17)
  });
  store.addInvoice({
    id: uid("inv"),
    userId: demo.id,
    number: "SL-1002",
    plan: "pro",
    interval: "monthly",
    amount: 1900,
    currency: "USD",
    status: "open",
    provider: "demo",
    cardLast4: "4242",
    periodStart: nowIso(),
    periodEnd: daysFromNow(30),
    createdAt: nowIso()
  });

  addNotificationFor(demo.id, { type: "success", title: "Demo data ready", body: "Your demo project with AI analysis and 3 shorts is ready to explore." });
  seedActivity(demo.id, "project_created", "Created project “Futuristic City Reel”", { projectId });
  seedActivity(demo.id, "analysis_done", "AI analysis completed", { projectId });
  seedActivity(demo.id, "shorts_generated", "Generated 3 AI shorts", { projectId });

  return { admin, demo, projectId };
}
