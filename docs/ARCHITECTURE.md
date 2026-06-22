<!-- Owner: /design — do not edit from other phase commands. -->

# 🏛️ Architecture — TechScreen

> 🎯 Serves `docs/PROJECT.md`. Judged by *design for change*: every seam is placed so the next change is small and local.

## 🗺️ Overview

A single Cloudflare Worker. One HTTP entry point routes the chat UI and the JSON API through a thin **service** layer; services talk to storage through a **repository port** and to the model through an **LLM port**. D1 (prod), an in-memory fake (tests), Anthropic Claude (prod), and a scripted fake (tests) are all interchangeable.

```
Browser ──▶ Worker (createApp(deps).fetch)
              │
              ├─ GET  /interview/:token        ─▶ serve chat HTML
              ├─ POST /api/sessions            ─▶ createSession()       (admin)
              ├─ POST /api/sessions/:t/turns   ─▶ submitAnswer()        (candidate)
              ├─ POST /api/sessions/:t/complete─▶ completeAndScore()
              └─ GET  /api/sessions/:t/results ─▶ getResults()
                          │
                services ──┼─▶ SessionRepository  (port)  ─▶ D1 | in-memory fake
                           └─▶ LlmClient          (port)  ─▶ Anthropic | scripted fake
```

## 🧩 Components & boundaries

- **`src/app.ts`** — `createApp(deps)` returns `{ fetch(req) }`. Pure routing + HTTP shaping. No business logic, no DB, no LLM. **Deployed entry point** — specs drive this.
- **`src/server.ts`** — Workers `default.fetch` export; wires real D1 + Anthropic client from `env`. The only place prod adapters are constructed.
- **`src/sessions/service.ts`** — `createSession`, `submitAnswer`, `completeAndScore`, `getResults`. Pure-ish functions taking `deps`. Returns `Result<T, E>`; never throws for expected failures.
- **`src/sessions/repository.ts`** — `SessionRepository` **port** + domain types (`Session`, `Turn`, `Score`).
- **`src/llm/client.ts`** — `LlmClient` port: `chat(messages) → assistantMessage` and `judge(transcript) → scores`. Decouples interview/scoring logic from any model vendor.
- **`src/llm/anthropic.ts`** — Anthropic adapter implementing `LlmClient`.
- **`src/sessions/questions.ts`** — Static curated question bank per topic (TypeScript, React, Python, AI). Plain TS module — no DB lookup, hot-reloadable by edit-deploy.
- **`src/sessions/prompts.ts`** — Interviewer system prompt and judge rubric prompt.
- **`src/sessions/schema.ts`** — Drizzle SQLite schema.
- **`src/ui/chat.html`** — Static chat UI served by the Worker. Plain HTML + vanilla JS. No build step. POSTs to the JSON API.
- **`src/shared/result.ts`** — `Result` type + `ok`/`err` helpers.

Boundary rule: **services depend on ports, never on Drizzle or Anthropic SDK.** Swapping the datastore or the model is a one-file change in `server.ts`.

## 🔁 Data flow

1. **Create session (admin)** — `POST /api/sessions` with admin secret → generate URL-safe token → insert `sessions` row (status=`pending`) → return `{ token, url }`.
2. **Open interview** — `GET /interview/:token` → serves chat HTML. UI calls `POST /api/sessions/:t/turns` with empty body to get the opening question.
3. **Turn loop** — candidate submits answer → service appends `turn` (role=`user`) → asks `LlmClient.chat()` with [system prompt + question bank + turns so far + current question pointer] → appends `turn` (role=`assistant`) → returns assistant text + `isComplete` flag. When the question bank is exhausted, service marks session `awaiting_scoring`.
4. **Complete & score** — `POST /api/sessions/:t/complete` → load all turns → call `LlmClient.judge(transcript)` → judge returns `{topic, score:1-5, notes}[]` + `overall` → persist `scores` rows → status=`complete`.
5. **Results** — `GET /api/sessions/:t/results` → return scores + per-topic notes if status=`complete`, else 409.

## 🗄️ Data model

- **`sessions`** — `id` pk, `token` (unique, not null, URL-safe ~32 chars), `status` (`pending` | `active` | `awaiting_scoring` | `complete`), `created_at`, `started_at` (nullable), `completed_at` (nullable), `current_topic` (nullable), `current_question_index` (int default 0).
- **`turns`** — `id` pk, `session_id` (FK → sessions, NOT NULL, `ON DELETE cascade`), `role` (`user` | `assistant` | `system`), `content` (text), `topic` (nullable), `question_id` (nullable, references question bank by string id), `created_at`. Strict insert-order via `id`.
- **`scores`** — `id` pk, `session_id` (FK), `topic` (`typescript` | `react` | `python` | `ai` | `overall`), `score` (int 1–5), `notes` (text), `created_at`. Unique on (`session_id`, `topic`).

**Why a `turns` table:** the conversation IS the data — required to replay context to the LLM each turn and to feed the judge. Rejected: blob of JSON on `sessions` — opaque, hard to query, lossy.

**Why a `scores` table (vs JSON column):** lets you filter/sort candidates by topic later without parsing. Rejected: `sessions.scores_json` — fine for MVP but loses cheap per-topic queries the moment you want them.

## ⚖️ Key decisions (choice · why · rejected alternative)

1. **No web framework; hand-routed Web-standard `fetch`.** Why: small surface, matches `tech.md` (Web APIs, light frameworks), runs on Workers + Bun unchanged. *Rejected:* Hono — needless dep for a handful of routes.
2. **Structured question bank + AI follow-up (not fully AI-driven).** Why: predictable coverage across the 4 topics, deterministic length, easier to score consistently. *Rejected:* fully LLM-generated questions — wider variance, harder to compare candidates apples-to-apples.
3. **Separate judge pass on full transcript (not inline scoring).** Why: cleaner separation of concerns; judge sees the whole picture; interviewer prompt stays focused on questioning. *Rejected:* inline scoring — mixes concerns, makes per-turn prompts heavier and less consistent.
4. **`SessionRepository` + `LlmClient` ports.** Why: lets specs drive the real entry point with in-memory + scripted fakes (bdd-specs rule 7); D1↔fake and Anthropic↔fake swaps are one-file changes. *Rejected:* calling Drizzle / Anthropic SDK directly from handlers — couples every test to a real DB and a paid API call.
5. **Static question bank as a TS module (not a DB table).** Why: questions are code, not user data; review in git, edit and redeploy. *Rejected:* `questions` table — adds an admin CRUD surface you don't need at MVP.
6. **`Result<T,E>` for expected failures** (invalid token, session not found, session not complete, judge failure). Why: `tech.md` mandate; failures are part of the API contract. *Rejected:* throwing — hides the contract.
7. **One-time-use token per session.** Why: prevents score-shopping by repeated attempts; lets you tie scores to a person. *Rejected:* shared public link with name input — lower trust, no per-candidate isolation.
8. **Anthropic Claude over Workers AI.** Why: quality of judging open-ended technical answers materially affects whether scores are trustworthy. *Rejected:* Workers AI (Llama) — free but lower technical depth; revisit if cost becomes a problem.
9. **Default model: `claude-sonnet-4-6` for both interviewer and judge.** Why: strongest quality/cost balance at MVP scale; both roles need solid reasoning. *Rejected:* Opus for judge — overkill at MVP; Haiku for interviewer — risks shallow follow-ups.
10. **Vanilla HTML/JS chat UI, no React/build step.** Why: `tech.md` says keep frontend light + no build where avoidable; UI is a chat box and a results panel. *Rejected:* React/Vite — build pipeline for ~200 lines of UI.

## 🚧 Explicitly not building (YAGNI)

Recruiter dashboard, candidate management, custom question sets, accounts, scheduling, video/audio, plagiarism/cheating detection, team collaboration, streaming responses, multilingual support, retake flow.

## ⚠️ Hardest risk + fallback

**Judge inconsistency** — same answer scored differently across runs. Fallback: judge prompt enforces a rubric (1–5 anchors per topic) and asks for short rationale notes alongside each score; if scoring fails JSON validation, retry once with a stricter "respond JSON only" reminder before returning `judge_failed` and surfacing the transcript for manual review.

## 🧭 Non-functionals

- **Scale:** handful of candidates/day at MVP. D1 free tier and Anthropic per-call costs are fine.
- **Latency:** turn round-trip dominated by LLM (1–5s). No streaming at MVP.
- **Cost ceiling:** ~$0.10–0.30 per candidate at Sonnet rates for a 15-min session. Hard cap not enforced in code yet.
- **Auth:** admin endpoint (`POST /api/sessions`) gated by a shared `ADMIN_TOKEN` env var (bearer). Candidate endpoints gated by session token in URL.

## 📝 TODO

- Confirm `claude-sonnet-4-6` vs `claude-haiku-4-5-20251001` for interviewer once we measure follow-up quality.
- Decide if `GET /api/sessions/:t/results` should also be admin-gated (currently candidate-readable via their token).
- Per-IP rate limit on `submitAnswer` to bound runaway cost — defer until needed.
