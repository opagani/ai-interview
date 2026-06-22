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

### [2026-06-21] /explore — real project defined: TechScreen AI interviewer
- **What:** AI chatbot that interviews job candidates on TypeScript, React, Python, and AI; scores per topic; candidate self-serves via link.
- **Why:** Replaces slow first-round phone screens for independent engineers hiring technical roles.
- **Scope cut:** No dashboard, no auth, no custom questions at MVP — just the bot and a score.
- **Previous DEMO (ShortLink) is superseded.** All prior demo artifacts are throwaway.

### [2026-06-21] /design — no web framework, hand-routed Web-standard fetch
- **Why:** Few routes, matches tech.md (Web APIs, light frameworks), runs Workers + Bun unchanged.
- **Rejected:** Hono — needless dep at this size.

### [2026-06-21] /design — SessionRepository + LlmClient ports
- **Why:** Specs drive the real entry point with in-memory + scripted fakes; D1↔fake and Anthropic↔fake swaps are one-file changes.
- **Rejected:** Calling Drizzle / Anthropic SDK directly from handlers — couples every test to a real DB and a paid API call.

### [2026-06-21] /design — structured question bank + AI follow-up (not fully AI-driven)
- **Why:** Predictable topic coverage, deterministic length, consistent scoring across candidates.
- **Rejected:** Fully LLM-generated questions — wider variance, harder to compare candidates.

### [2026-06-21] /design — separate AI judge pass over full transcript
- **Why:** Judge sees the whole conversation; interviewer prompt stays focused on questioning; cleaner separation.
- **Rejected:** Inline scoring as the interviewer goes — mixes concerns, heavier per-turn prompts.

### [2026-06-21] /design — Anthropic Claude (Sonnet 4.6) over Workers AI
- **Why:** Quality of judging open-ended technical answers materially affects whether scores are trustworthy.
- **Rejected:** Workers AI (Llama) — free but lower technical depth. Revisit if cost bites.

### [2026-06-21] /design — static question bank as a TS module, not a DB table
- **Why:** Questions are code; review in git, edit + redeploy. Avoids an admin CRUD surface.
- **Rejected:** `questions` table — premature at MVP.

### [2026-06-21] /design — turns table over a JSON blob on sessions
- **Why:** Conversation IS the data; needed for LLM replay and judge input; insert-ordered, queryable.
- **Rejected:** `sessions.transcript_json` — opaque, hard to query, lossy.

### [2026-06-21] /design — one-time-use token per candidate session
- **Why:** Prevents score-shopping; ties scores to a person; matches "one attempt per link" decision.
- **Rejected:** Shared public link — lower trust, no per-candidate isolation.

### [2026-06-21] /design — vanilla HTML/JS chat UI, no build step
- **Why:** UI is a chat box and results panel; matches tech.md (keep frontend light, no build where avoidable).
- **Rejected:** React/Vite — build pipeline for ~200 lines of UI.

### [2026-06-21] /plan — STORIES.md/PLAN.md regenerated for TechScreen
- **Why:** Prior STORIES.md / PLAN.md were ShortLink DEMO artifacts (all `- [x]`); MEMORY notes the DEMO is superseded.
- **What:** 5 stories (one per SPEC feature), 19 tasks in PLAN.md; specs generated via bdd-specs and verified RED (5/5 fail on missing modules).

### [2026-06-21] /plan — createApp deps include `questions`, `adminToken`, `baseUrl`
- **Why:** Specs need a tiny 4-question test bank to keep the turn loop tractable, a known admin secret to test auth, and a known baseUrl to assert the candidate URL. Promoting these to deps keeps the app pure.
- **How to apply:** T12 implements `createApp({ repo, llm, questions, adminToken, baseUrl })`. `src/server.ts` (T18) wires the real values from `env`.

### [2026-06-21] /plan — UI deferred to T19, last task
- **Why:** Building UI before the JSON API is green invents API shapes the backend then has to honour. T12 already wires `GET /interview/:token` as a route; T19 just supplies the HTML asset.
- **Rejected:** UI parallel with services — risks API drift and rework.

<!-- /explore, /design, /plan, /build-loop, /document each append here -->
