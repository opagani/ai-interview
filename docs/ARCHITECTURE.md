<!-- Owner: /design — do not edit from other phase commands. -->

# 🏛️ Architecture — ShortLink (DEMO)

> 🧪 Demo design. Serves `docs/PROJECT.md`. Judged by *design for change*:
> every seam is placed so the next change is a small, local diff.

## 🗺️ Overview

A single Cloudflare Worker. One HTTP entry point routes three operations
through a thin **service** layer; the service talks to storage only through a
**repository port**, so D1 (prod) and an in-memory fake (tests) are
interchangeable. No framework — hand-routed `Request → Response` using Web
standard APIs.

```
Request ──▶ createApp(deps).fetch ──┬─ POST /links            ─▶ createLink()
(Worker entry)                      ├─ GET  /:slug            ─▶ resolveSlug()  ─▶ 302 + recordClick()
                                    └─ GET  /api/links/:slug/stats ─▶ getStats()
                                              │
                                   service ──▶ LinkRepository (port)
                                                 ├─ D1LinkRepository  (prod, Drizzle/D1)
                                                 └─ fakeLinkRepository (tests, in-memory)
```

## 🧩 Components & boundaries

- **`src/app.ts`** — `createApp(deps)` returns `{ fetch(req) }`. Pure routing +
  HTTP shaping (status, headers, JSON). No business logic, no DB. **Deployed
  entry point** — specs drive this.
- **`src/server.ts`** — Workers `default.fetch` export; wires the real D1
  repository from `env` and delegates to `createApp`. The only place prod
  adapters are constructed.
- **`src/links/service.ts`** — `createLink`, `resolveSlug`, `getStats`. Pure-ish
  functions taking `deps` (repo + slug generator). Return `Result<T, E>`; never
  throw for expected failures.
- **`src/links/repository.ts`** — the `LinkRepository` **port** (interface) +
  domain types (`Link`, `NewLink`). The seam that decouples logic from D1.
- **`src/links/schema.ts`** — Drizzle SQLite schema (`links`, `clicks`).
- **`src/shared/result.ts`** — `Result` type + `ok`/`err` helpers.

Boundary rule: **logic depends on the port, never on Drizzle/D1.** Swapping the
datastore is a one-file change (`server.ts`).

## 🔁 Data flow

1. **Create** — validate URL → generate slug → `repo.insert` (retry on slug
   collision) → 201 `{ slug, shortUrl, targetUrl }`.
2. **Redirect** — `repo.findBySlug` → 404 if missing → `repo.recordClick` →
   302 `Location: targetUrl`.
3. **Stats** — `repo.findBySlug` → 404 if missing → `repo.countClicks` →
   200 `{ slug, targetUrl, clicks }`.

## 🗄️ Data model

- **`links`** — `id` pk, `slug` (unique, not null), `target_url` (not null),
  `created_at`.
- **`clicks`** — `id` pk, `link_id` (FK → links, NOT NULL, `ON DELETE cascade`),
  `created_at`. One row per visit. Click count = `count(*)` per `link_id`.

Why a `clicks` table over a counter column: keeps per-click metadata (referrer,
UA, time series) a non-breaking add later. Rejected: `links.click_count`
integer — simpler/faster but throws away history and needs a concurrent-update
path. For a demo the row-per-click cost is fine; revisit if D1 writes bite.

## ⚖️ Key decisions (choice · why · rejected alternative)

1. **No web framework; hand-routed Web-standard `fetch`.** Why: 3 routes don't
   justify a dependency; matches `tech.md` ("Web standard APIs", light
   frameworks) and runs on Workers + Bun unchanged. *Rejected:* Hono — lovely
   ergonomics, but an extra dep and the test path would pull it in for no gain
   at this size.
2. **Repository port + injected deps.** Why: lets specs drive the real entry
   point with an in-memory fake (bdd-specs rule 7) and makes the D1↔fake swap a
   one-file change. *Rejected:* calling Drizzle directly in handlers — couples
   every test to a real DB and every logic change to the schema.
3. **`Result<T,E>` for expected failures (invalid URL, not found, slug taken).**
   Why: `tech.md` mandate; failures are part of the API contract, not
   exceptions. *Rejected:* throwing — hides the contract and complicates the
   functional service layer.
4. **SQLite (Drizzle) local → D1 prod, D1 for everything.** Why: from
   `tech.md`/MEMORY standing decisions; edge-native, free-tier. *Rejected:*
   Postgres — needs a socket proxy on Workers.
5. **7-char base62 slug, generate-and-retry on collision.** Why: ~3.5T keyspace,
   collisions rare; retry keeps it stateless. *Rejected:* monotonic counter —
   leaks volume and needs a single-writer sequence.

## 🚧 Explicitly not building (YAGNI)

Auth, custom slugs, edit/delete, expiry, rate limiting, UI, rich analytics.

## ⚠️ Hardest risk + fallback

Slug collision under concurrency. Fallback: unique index on `slug` makes a
collision a constraint error the create path catches and retries (bounded
attempts) before returning `slug_taken`.
