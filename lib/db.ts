import type { User, Project, Analysis, Short, Caption, ExportJob, Invoice, Subscription, Notification, Announcement, Ticket, UsageLog, ActivityLog, ContentPack, EditSession, OAuthState } from "@/types";

type TableName =
  | "users"
  | "projects"
  | "analysis"
  | "shorts"
  | "captions"
  | "exports"
  | "invoices"
  | "subscriptions"
  | "notifications"
  | "announcements"
  | "tickets"
  | "usage"
  | "activity"
  | "content"
  | "edits"
  | "oauth";

export const TABLES: TableName[] = [
  "users",
  "projects",
  "analysis",
  "shorts",
  "captions",
  "exports",
  "invoices",
  "subscriptions",
  "notifications",
  "announcements",
  "tickets",
  "usage",
  "activity",
  "content",
  "edits",
  "oauth"
];

export type Row = object;

const ROOT = process.cwd();
const DATA_DIR = `${ROOT}/data`;

// ---------- File-backed store with in-process cache ----------
const cache = new Map<TableName, Row[]>();
let loaded = false;

import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "fs";
import { join } from "path";

function ensureLoaded() {
  if (loaded) return;
  mkdirSync(DATA_DIR, { recursive: true });
  for (const t of TABLES) {
    const p = join(DATA_DIR, `${t}.json`);
    if (existsSync(p)) {
      try {
        cache.set(t, JSON.parse(readFileSync(p, "utf8")) as Row[]);
      } catch {
        cache.set(t, []);
      }
    } else {
      cache.set(t, []);
    }
  }
  loaded = true;
}

function persist(t: TableName) {
  const rows = cache.get(t) ?? [];
  const tmp = join(DATA_DIR, `${t}.json.tmp`);
  const final = join(DATA_DIR, `${t}.json`);
  writeFileSync(tmp, JSON.stringify(rows, null, 2), "utf8");
  renameSync(tmp, final);
}

function table<T extends Row>(t: TableName): T[] {
  ensureLoaded();
  return cache.get(t) as T[];
}

// ---------- Generic CRUD ----------
export const db = {
  all<T extends Row>(t: TableName): T[] {
    return table<T>(t);
  },
  find<T extends Row>(t: TableName, pred: (r: T) => boolean): T | undefined {
    return table<T>(t).find(pred);
  },
  where<T extends Row>(t: TableName, pred: (r: T) => boolean): T[] {
    return table<T>(t).filter(pred);
  },
  byId<T extends Row>(t: TableName, id: string): T | undefined {
    return table<T>(t).find((r) => (r as { id: string }).id === id);
  },
  insert<T extends Row>(t: TableName, row: T): T {
    table<T>(t).push(row);
    persist(t);
    return row;
  },
  insertMany<T extends Row>(t: TableName, rows: T[]): T[] {
    if (rows.length === 0) return rows;
    table<T>(t).push(...rows);
    persist(t);
    return rows;
  },
  update<T extends Row>(t: TableName, id: string, patch: Partial<T>): T | undefined {
    const rows = table<T>(t);
    const idx = rows.findIndex((r) => (r as { id: string }).id === id);
    if (idx === -1) return undefined;
    rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() } as T;
    persist(t);
    return rows[idx];
  },
  remove(t: TableName, id: string): boolean {
    const rows = table<Row>(t);
    const idx = rows.findIndex((r) => (r as { id?: string }).id === id);
    if (idx === -1) return false;
    rows.splice(idx, 1);
    persist(t);
    return true;
  },
  count(t: TableName): number {
    return table<Row>(t).length;
  },
  /** Atomic add/subtract a numeric field */
  increment(t: TableName, id: string, field: string, delta: number) {
    const rows = table<Row>(t);
    const idx = rows.findIndex((r) => (r as { id?: string }).id === id);
    if (idx === -1) return undefined;
    const cur = Number((rows[idx] as Record<string, unknown>)[field] ?? 0);
    (rows[idx] as Record<string, unknown>)[field] = cur + delta;
    persist(t);
    return rows[idx];
  },
  upsert<T extends Row>(t: TableName, id: string, make: () => T): T {
    const existing = db.byId<T>(t, id);
    if (existing) return existing;
    return db.insert(t, make());
  },
  replaceAll<T extends Row>(t: TableName, rows: T[]) {
    cache.set(t, rows);
    persist(t);
  }
};

// ---------- Typed convenience accessors ----------
export const store = {
  db,
  users: () => db.all<User>("users"),
  userById: (id: string) => db.byId<User>("users", id),
  userByEmail: (email: string) =>
    db.find<User>("users", (u) => u.email.toLowerCase() === email.toLowerCase()),
  saveUser: (u: User) => db.update<User>("users", u.id, u),
  addUser: (u: User) => db.insert<User>("users", u),

  projects: (userId: string) =>
    db.where<Project>("projects", (p) => p.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  projectById: (id: string) => db.byId<Project>("projects", id),
  saveProject: (p: Project) => db.update<Project>("projects", p.id, p),
  addProject: (p: Project) => db.insert<Project>("projects", p),
  deleteProject: (id: string) => db.remove("projects", id),

  analysisByProject: (projectId: string) =>
    db.find<Analysis>("analysis", (a) => a.projectId === projectId),
  saveAnalysis: (a: Analysis) => db.upsert<Analysis>("analysis", a.id, () => a),
  addAnalysis: (a: Analysis) => db.insert<Analysis>("analysis", a),

  shortsForProject: (projectId: string) =>
    db.where<Short>("shorts", (s) => s.projectId === projectId).sort((a, b) => b.score - a.score),
  shortById: (id: string) => db.byId<Short>("shorts", id),
  addShort: (s: Short) => db.insert<Short>("shorts", s),
  saveShort: (s: Short) => db.update<Short>("shorts", s.id, s),
  removeShort: (id: string) => db.remove("shorts", id),

  captionForShort: (shortId: string) => db.find<Caption>("captions", (c) => c.shortId === shortId),
  saveCaption: (c: Caption) => db.upsert<Caption>("captions", c.id, () => c),

  exportsForUser: (userId: string) =>
    db.where<ExportJob>("exports", (e) => e.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  exportById: (id: string) => db.byId<ExportJob>("exports", id),
  addExport: (e: ExportJob) => db.insert<ExportJob>("exports", e),
  saveExport: (e: ExportJob) => db.update<ExportJob>("exports", e.id, e),

  subscriptionForUser: (userId: string) =>
    db.find<Subscription>("subscriptions", (s) => s.userId === userId && s.status === "active"),
  addSubscription: (s: Subscription) => db.insert<Subscription>("subscriptions", s),
  saveSubscription: (s: Subscription) => db.update<Subscription>("subscriptions", s.id, s),

  invoicesForUser: (userId: string) =>
    db.where<Invoice>("invoices", (i) => i.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  invoiceById: (id: string) => db.byId<Invoice>("invoices", id),
  addInvoice: (i: Invoice) => db.insert<Invoice>("invoices", i),
  saveInvoice: (i: Invoice) => db.update<Invoice>("invoices", i.id, i),

  notificationsForUser: (userId: string) =>
    db.where<Notification>("notifications", (n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  addNotification: (n: Notification) => db.insert<Notification>("notifications", n),
  saveNotification: (n: Notification) => db.update<Notification>("notifications", n.id, n),

  announcements: () => db.all<Announcement>("announcements").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  addAnnouncement: (a: Announcement) => db.insert<Announcement>("announcements", a),

  ticketsForUser: (userId: string) =>
    db.where<Ticket>("tickets", (t) => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  allTickets: () => db.all<Ticket>("tickets").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  ticketById: (id: string) => db.byId<Ticket>("tickets", id),
  addTicket: (t: Ticket) => db.insert<Ticket>("tickets", t),
  saveTicket: (t: Ticket) => db.update<Ticket>("tickets", t.id, t),

  usageForUser: (userId: string) =>
    db.where<UsageLog>("usage", (u) => u.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  addUsage: (u: UsageLog) => db.insert<UsageLog>("usage", u),

  activityForUser: (userId: string) =>
    db.where<ActivityLog>("activity", (a) => a.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  addActivity: (a: ActivityLog) => db.insert<ActivityLog>("activity", a),

  contentForProject: (projectId: string) =>
    db.find<ContentPack>("content", (c) => c.projectId === projectId),
  saveContent: (c: ContentPack) => db.upsert<ContentPack>("content", c.id, () => c),

  editSession: (projectId: string) => db.find<EditSession>("edits", (e) => e.projectId === projectId),
  saveEditSession: (e: EditSession) => db.upsert<EditSession>("edits", e.id, () => e),

  oauthStateById: (id: string) => db.byId<OAuthState>("oauth", id),
  addOAuthState: (s: OAuthState) => db.insert<OAuthState>("oauth", s),
  removeOAuthState: (id: string) => db.remove("oauth", id),

  allUsers: () => db.all<User>("users"),
  allProjects: () => db.all<Project>("projects"),
  allShorts: () => db.all<Short>("shorts"),
  allAnalysis: () => db.all<Analysis>("analysis"),
  allExports: () => db.all<ExportJob>("exports"),
  allUsage: () => db.all<UsageLog>("usage"),
  allInvoices: () => db.all<Invoice>("invoices")
};
