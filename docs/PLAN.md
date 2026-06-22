<!-- Owner: /plan — do not edit from other phase commands. -->

# 🗂️ Plan — TechScreen

> Task DAG. One task = one reviewable, committable unit. Driven by `/build-loop`. Specs are generated from STORIES.md via `bdd-specs` and start red.

## Legend

`id` · `story:` implemented · `depends-on:` · `parallel-group:`

## Tasks

### 🏗️ Scaffolding

- [x] **T1** — Scaffold Bun project: `package.json`, `tsconfig.json` (strict), `bunfig.toml`, `.gitignore`, `wrangler.toml` (Workers config with D1 binding placeholder). · story:— · depends-on:— · parallel-group:—

### 🧱 Foundation (parallel — no shared state)

- [x] **T2** — `Result<T,E>` type + `ok`/`err` helpers in `src/shared/result.ts`. · story:— · depends-on:T1 · parallel-group:foundation
- [x] **T3** — Domain types + `SessionRepository` port in `src/sessions/repository.ts` (`Session`, `Turn`, `Score`, `SessionStatus`, repo interface). · story:— · depends-on:T1 · parallel-group:foundation
- [x] **T4** — `LlmClient` port in `src/llm/client.ts` with `chat(messages)` and `judge(transcript)` signatures + message/score types. · story:— · depends-on:T1 · parallel-group:foundation
- [x] **T5** — Drizzle SQLite schema in `src/sessions/schema.ts` (`sessions`, `turns`, `scores` with unique token, FK cascades, status enum). · story:— · depends-on:T1 · parallel-group:foundation
- [x] **T6** — Question bank module in `src/sessions/questions.ts` (~3–4 curated questions per topic across TypeScript / React / Python / AI). · story:— · depends-on:T1 · parallel-group:foundation
- [x] **T7** — Interviewer + judge prompts in `src/sessions/prompts.ts` (system prompt with rubric anchors; judge prompt returning strict JSON shape). · story:— · depends-on:T1 · parallel-group:foundation

### ⚙️ Services (parallel — share types only)

- [x] **T8** — `createSession(deps)` service: validate admin token, generate URL-safe token, insert pending session, return `Result`. · story:STORY-1 · depends-on:T2,T3 · parallel-group:services
- [x] **T9** — `submitAnswer(deps)` service: append user turn (when non-empty), call `LlmClient.chat`, append assistant turn, advance topic/question index, flip status `pending→active→awaiting_scoring`. Rollback both turns on LLM failure. · story:STORY-3 · depends-on:T2,T3,T4,T6,T7 · parallel-group:services
- [x] **T10** — `completeAndScore(deps)` service: load transcript, call `LlmClient.judge`, persist 5 scores (4 topics + overall), flip to `complete`, idempotent on already-complete sessions. · story:STORY-4 · depends-on:T2,T3,T4,T7 · parallel-group:services
- [x] **T11** — `getResults(deps)` service: 404 unknown, 409 if not complete, return scores otherwise. · story:STORY-5 · depends-on:T2,T3 · parallel-group:services

### 🌐 HTTP entry

- [x] **T12** — `createApp(deps)` router + HTTP shaping in `src/app.ts`: routes `POST /api/sessions`, `GET /interview/:token`, `POST /api/sessions/:token/turns`, `POST /api/sessions/:token/complete`, `GET /api/sessions/:token/results`. Status codes, JSON bodies, Authorization parsing, error → `{error}` shape. · story:STORY-1,2,3,4,5 · depends-on:T8,T9,T10,T11
- [x] **T13** — In-memory fake repository in `src/sessions/repository.fake.ts` (test-only) implementing the port. · story:— · depends-on:T3
- [x] **T14** — Scripted fake LLM client in `src/llm/client.fake.ts` (test-only) implementing the port with deterministic canned responses + a "throw next call" toggle. · story:— · depends-on:T4
- [x] **T15** — **wire:** drive all 5 features through `createApp(deps).fetch` with the in-memory repo + scripted fake LLM injected. Acceptance: every STORY-1..5 spec turns green by sending a real `Request` through the handler — no service-level shortcuts. · story:STORY-1,2,3,4,5 · depends-on:T12,T13,T14

### 🔌 Adapters (parallel after wire — behind ports)

- [x] **T16** — `D1SessionRepository` in `src/sessions/repository.d1.ts` implementing the port over Drizzle/D1, plus drizzle-kit migration for the schema. · story:— · depends-on:T3,T5 · parallel-group:adapters
- [x] **T17** — `AnthropicLlmClient` in `src/llm/client.anthropic.ts` implementing the port: model `claude-sonnet-4-6` for both `chat` and `judge`, judge parses strict JSON with one retry on parse failure. · story:— · depends-on:T4,T7 · parallel-group:adapters

### 🚀 Production wire

- [x] **T18** — **wire:** Workers `default.fetch` in `src/server.ts` builds `D1SessionRepository` + `AnthropicLlmClient` from `env` (ADMIN_TOKEN, ANTHROPIC_API_KEY, D1 binding) and delegates to `createApp`. Acceptance: a real request through `server.default.fetch` against a local D1 binding completes a session end-to-end against the real Anthropic API in `/verify`. · story:STORY-1,2,3,4,5 · depends-on:T15,T16,T17

### 🖥️ UI

- [x] **T19** — Vanilla chat UI in `src/ui/chat.html` (and a tiny inline JS): renders the conversation, posts to `/api/sessions/:token/turns`, calls `/complete` when `isComplete`, then shows the per-topic scores. Served by `GET /interview/:token` (already wired in T12); also branches to a results-only view when the session is already `complete`. · story:STORY-2,3,4,5 · depends-on:T18

## First shippable slice

**T1** → foundation (**T2,T3,T4,T5,T6,T7** parallel) → services (**T8,T9,T10,T11** parallel) → **T12** → **T13,T14** → **T15 (wire)**. At T15 all 5 feature specs are green through the deployed `createApp` handler with fakes. T16/T17/T18 add D1 + Anthropic; T19 adds the candidate-facing UI.

## Parallel groups

- `foundation`: T2, T3, T4, T5, T6, T7 (independent files, no shared logic).
- `services`: T8, T9, T10, T11 (share types only; no ordering between them).
- `adapters`: T16, T17 (independent; both gated only by the ports they implement).

## Sequencing notes

- **T9 depends on T6 and T7** (not just T2/T3/T4) because question advancement and prompt construction are inside the turn service. Keeping them as separate foundation modules prevents one fat file.
- **T13 / T14 (fakes) gate T15 (wire) but not the services** — services compile against the ports alone. The fakes only matter when specs need to drive the entry point.
- **Adapters (T16, T17) intentionally come after T15.** The in-memory + scripted fakes prove the full feature set first; only then do we wire prod adapters. Reverse order risks debugging adapter bugs through a half-built feature.
- **UI (T19) intentionally last.** Per the design, the chat HTML is served by `GET /interview/:token` which T12 already wires; T19 fills in the asset. Building UI before the API exists invents shapes the API would later have to honour.
