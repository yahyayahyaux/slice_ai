# Prisma migrations

The app runs out-of-the-box on the built-in file-backed adapter (`lib/db.ts`),
so no database is required for development or demo use.

To switch to PostgreSQL/MySQL in production:

```bash
# 1. Configure the database URL
#    DATABASE_URL="postgresql://user:pass@host:5432/slice" in .env.local

# 2. Generate the client and create the initial migration
npx prisma generate
npx prisma migrate dev --name init

# 3. The store layer (lib/db/prisma.ts) detects DATABASE_URL and hands the
#    real Prisma client to the rest of the app automatically.
```

The schema mirrors the JSON file store 1:1 (see `prisma/schema.prisma`),
including users, projects, analysis, shorts, captions, exports, subscriptions,
invoices, notifications, usage/activity logs, content packs, edit sessions,
announcements and support tickets.
