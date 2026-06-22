<!-- Owner: /document curates; every phase command appends. -->

# 🧠 Memory

The project's decision log. Append a dated entry whenever a decision is made.
Distinct from the `~/.claude` memory system.

## 📌 Standing decisions (seeded from /interview)

### [2026-06-21] Language & runtime — TypeScript on Bun
- **Why:** Only language in use; Bun runs TS directly with no build step.
- **Reconsider when:** A target needs a runtime feature Bun can't provide.

### [2026-06-21] Database — SQLite (Drizzle) local → Cloudflare D1 prod
- **Why:** Edge-native; D1 is SQLite-compatible so it ports via Drizzle.
- **Reconsider when:** Write/throughput needs outgrow single-writer SQLite/D1.

### [2026-06-21] Deploy target — Cloudflare Workers, free-tier-first
- **Why:** Zero cost until traffic; matches free-tier-first posture.
- **Reconsider when:** We need Bun-only server APIs or persistent sockets in
  prod (would force Fly/VPS instead).

### [2026-06-21] Conventions — functional-leaning TS, REST + Result errors
- **Why:** Pure functions/modules first; typed errors over throwing; strict TS
  as the hard gate. Tests-first on load-bearing behavior.
- **Reconsider when:** A domain genuinely needs heavier OO/patterns.

## 🧾 Phase entries

### [2026-06-21] /explore — cohort dry run, no real project captured
- **Why:** Walking the pipeline for `ai-summer-cohort/session-1/skills` to
  learn the toolkit; there's no real product to interview about yet.
- **How to apply:** `/design`, `/plan`, `/build-loop` should stop and ask for
  a real PROJECT.md before doing any work. Re-run `/explore` when a real
  idea exists.

### [2026-06-21] DEMO project chosen — ShortLink URL shortener
- **Why:** User repeatedly said "proceed" with no idea supplied; a URL
  shortener was picked to exercise /explore→/design→/plan→bdd-specs on the
  user's stack. Every artifact is marked DEMO.
- **How to apply:** All `docs/*` and `src/*` are throwaway demo content. When a
  real idea exists, re-run `/explore` to overwrite — don't build on this.

### [2026-06-21] /design — no web framework, hand-routed Web-standard fetch
- **Why:** 3 routes don't justify a dependency; matches tech.md (Web APIs,
  light frameworks); runs on Workers + Bun unchanged.
- **Rejected:** Hono — nice ergonomics, needless dep at this size.

### [2026-06-21] /design — repository port + injected deps
- **Why:** Lets specs drive the real entry point with an in-memory fake
  (bdd-specs rule 7); D1↔fake swap is a one-file change (server.ts).
- **Rejected:** Drizzle calls in handlers — couples tests to a real DB.

### [2026-06-21] /design — clicks table over a counter column
- **Why:** Keeps per-click metadata a non-breaking add later; count = count(*).
- **Rejected:** links.click_count integer — loses history, needs concurrent update.

### [2026-06-21] /spec — bdd-specs generated, verified RED via `bun test`
- **Why:** Specs-first is the contract; 18 fail / 1 pass against the 501 stub
  confirms clean red (assertion mismatches, not import errors).
- **How to apply:** /build-loop turns these green task-by-task per PLAN.md
  (T1→foundation→services→T8→T9 wire is the first green slice).

<!-- /explore, /design, /plan, /build-loop, /document each append here -->
