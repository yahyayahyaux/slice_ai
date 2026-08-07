import { registerHandler, requeueInterrupted } from "@/lib/queue";
import { store } from "@/lib/db";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { seedDemoData } from "@/lib/seed";

let done = false;

/**
 * Global initialization: ensures storage dirs exist, recovers interrupted
 * jobs, wires pipeline handlers and seeds demo data on first boot.
 */
export async function init() {
  if (done) return;
  done = true;

  for (const dir of ["storage", "storage/projects", "storage/shorts", "storage/exports", "storage/thumbs", "storage/samples", "data"]) {
    mkdirSync(join(process.cwd(), dir), { recursive: true });
  }

  const { initPipeline } = await import("@/lib/pipeline");
  initPipeline();
  requeueInterrupted();

  // First-boot seed (demo accounts + sample project). Safe: only runs when
  // the database is completely empty. Set SEED_DEMO=false to disable.
  const seeded = store.allUsers().length > 0;
  if (!seeded && process.env.SEED_DEMO !== "false") {
    try {
      await seedDemoData();
    } catch (e) {
      console.error("Demo seed failed:", e);
    }
  }
}

export const storageRoot = () => join(process.cwd(), "storage");
export const hasSampleVideo = () => existsSync(join(process.cwd(), "storage", "samples", "futuristic-city.mp4"));
