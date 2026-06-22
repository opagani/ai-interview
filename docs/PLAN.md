<!-- Owner: /plan — do not edit from other phase commands. -->

# 🗂️ Plan — ShortLink (DEMO)

> 🧪 Demo task DAG. One task = one reviewable, committable unit. Driven by
> `/build-loop`. Specs (red) already exist for STORY-1..3.

## Legend

`id` · `story:` implemented · `depends-on:` · `parallel-group:`

## Tasks

- [x] **T1** — Scaffold Bun project: `package.json`, `tsconfig` (strict),
  `bunfig.toml`. · story:— · depends-on:— · parallel-group:—
- [x] **T2** — `Result<T,E>` type + `ok`/`err` helpers in `src/shared/result.ts`.
  · story:— · depends-on:T1 · parallel-group:foundation
- [x] **T3** — Domain types + `LinkRepository` port in
  `src/links/repository.ts`. · story:— · depends-on:T1 · parallel-group:foundation
- [x] **T4** — Drizzle schema (`links`, `clicks`) in `src/links/schema.ts`
  (STRICT, unique slug, FK cascade). · story:— · depends-on:T1 ·
  parallel-group:foundation
- [ ] **T5** — `createLink` service (validate URL, gen slug, retry on collision)
  returning `Result`. · story:STORY-1 · depends-on:T2,T3 · parallel-group:services
- [ ] **T6** — `resolveSlug` service (find or `not_found`, record click).
  · story:STORY-2 · depends-on:T2,T3 · parallel-group:services
- [ ] **T7** — `getStats` service (find or `not_found`, count clicks).
  · story:STORY-3 · depends-on:T2,T3 · parallel-group:services
- [ ] **T8** — `createApp(deps)` router + HTTP shaping (JSON, status codes,
  Location header) in `src/app.ts`. · story:STORY-1,2,3 · depends-on:T5,T6,T7
- [ ] **T9** — **wire:** `createLink/resolveSlug/getStats` into `createApp`
  routes so STORY-1..3 entry-point specs pass through the real handler.
  Acceptance: a real `Request` through `createApp(deps).fetch` produces the
  spec's side effect (201 + persisted link / 302 + recorded click / 200 +
  count). · story:STORY-1,2,3 · depends-on:T8
- [ ] **T10** — `D1LinkRepository` implementing the port over Drizzle/D1.
  · story:— · depends-on:T3,T4 · parallel-group:adapters
- [ ] **T11** — **wire:** Workers `default.fetch` in `src/server.ts` builds
  `D1LinkRepository` from `env` and delegates to `createApp`. Acceptance: a
  real request through `server.default.fetch` against a local D1 binding
  shortens + redirects end to end. · story:STORY-1,2,3 · depends-on:T9,T10

## First shippable slice

T1 → foundation (T2,T3,T4 parallel) → services (T5,T6,T7 parallel) → T8 → **T9
(wire)**. At T9 all three feature specs are green through the deployed handler
with the in-memory fake. T10/T11 add the real D1 adapter + Worker entry.

## Parallel groups

- `foundation`: T2, T3, T4 (no shared state).
- `services`: T5, T6, T7 (share types only; no ordering between them).
- `adapters`: T10 (independent of the service layer; behind the port).
