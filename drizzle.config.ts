// drizzle-kit config — generates SQLite/D1 migrations from the schema.
//
//   bunx drizzle-kit generate                         # schema.ts -> ./drizzle/*.sql
//   bunx wrangler d1 migrations apply shortlink --local   # apply to local D1
//   bunx wrangler d1 migrations apply shortlink --remote  # apply to prod D1
//
// drizzle-kit does NOT emit `STRICT` — after generate, edit each new migration
// so every CREATE TABLE ends `) STRICT;` (sqlite-dev convention).
//
// Postgres cutover: change dialect to 'postgresql'; column names are already
// Postgres-legal, so it's mechanical.

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/links/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
});
