// Drizzle SQLite schema — Postgres-portable per sqlite-dev conventions.
// Declare both tables STRICT in the generated migration (drizzle-kit won't).

import { sql } from "drizzle-orm";
import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const links = sqliteTable(
  "links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    targetUrl: text("target_url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("ux_links_slug").on(t.slug)],
);

export const clicks = sqliteTable(
  "clicks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // NOT NULL FK, explicit ON DELETE (sqlite-dev rule 5).
    linkId: integer("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("ix_clicks_link_id").on(t.linkId)],
);

// Belt-and-suspenders so an unused import never trips a linter in this stub.
export const _schemaProbe = sql`select 1`;
