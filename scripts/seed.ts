/** Standalone seed: npm run seed */
import { seedDemoData } from "../lib/seed";

async function main() {
  await seedDemoData();
  console.log("Demo data seeded. Sign in with demo@slice.app / demo1234 (admin: admin@slice.app / admin1234).");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
