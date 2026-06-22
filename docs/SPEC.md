<!-- Owner: /design — do not edit from other phase commands. -->

# 📋 Spec — TechScreen

> Testable, observable behavior only. `/plan` slices this into stories; `bdd-specs` turns it into executable specs.

## ✨ Features & behavior

### F1 — Create candidate session  ·  `POST /api/sessions`

Headers: `Authorization: Bearer {ADMIN_TOKEN}`. Request body: optional `{ "candidateName": string }`.

- Given a valid admin token, the system creates a new session with status `pending`, generates a unique URL-safe token, and responds **201** with `{ token, url, candidateName? }` where `url = {baseUrl}/interview/{token}`.
- The token is persistent and retrievable for subsequent calls until the session is `complete`.
- Given a missing or invalid admin token, responds **401** with `{ error: "unauthorized" }`; nothing is persisted.

### F2 — Open the interview UI  ·  `GET /interview/{token}`

- Given a valid token, responds **200** with the chat HTML page.
- Given an unknown token, responds **404** with a minimal "not found" HTML page.
- Given a token whose session is already `complete`, responds **200** with a page that immediately shows the final results instead of the chat.

### F3 — Submit a turn  ·  `POST /api/sessions/{token}/turns`

Request body: `{ "answer": string | null }`. `null`/empty answer is valid on the very first call (used to fetch the opening question).

- Given a valid token and session status `pending` or `active`, the system:
  1. If `answer` is non-empty, appends a `user` turn with that content.
  2. Generates the next assistant message via the LLM, using the system prompt + question bank + prior turns.
  3. Appends an `assistant` turn with the generated content.
  4. Sets session status to `active` on the first call and updates `current_topic` / `current_question_index` as it progresses.
  5. Responds **200** with `{ assistant: string, isComplete: boolean, topic: string }` where `isComplete = true` only when the question bank is exhausted.
- When `isComplete = true`, the service marks session status `awaiting_scoring` in the same request.
- Given an unknown token, responds **404** with `{ error: "not_found" }`.
- Given a token whose session is `awaiting_scoring` or `complete`, responds **409** with `{ error: "session_closed" }`.
- Given an LLM failure, responds **502** with `{ error: "llm_failed" }`; no turn is persisted from that failed attempt.

### F4 — Complete and score  ·  `POST /api/sessions/{token}/complete`

- Given a session in `awaiting_scoring`, the system:
  1. Loads the full transcript.
  2. Calls the LLM judge with the rubric prompt.
  3. Persists one `scores` row per topic (`typescript`, `react`, `python`, `ai`) and one for `overall`, each with `score` (int 1–5) and `notes` (rationale text).
  4. Sets session status `complete` and `completed_at`.
  5. Responds **200** with `{ scores: [{ topic, score, notes }], overall: { score, notes } }`.
- Given a session in `pending` or `active`, responds **409** with `{ error: "interview_in_progress" }`.
- Given a session already `complete`, the call is idempotent: it returns the previously persisted scores without re-judging.
- Given a judge failure that survives one retry, responds **502** with `{ error: "judge_failed" }`; session stays in `awaiting_scoring` so it can be retried.

### F5 — Read results  ·  `GET /api/sessions/{token}/results`

- Given a session with status `complete`, responds **200** with the same shape as F4 (`{ scores, overall }`).
- Given a session not yet `complete`, responds **409** with `{ error: "results_not_ready" }`.
- Given an unknown token, responds **404** with `{ error: "not_found" }`.

## 🔢 Invariants

- **Token uniqueness:** every `sessions.token` is unique across all rows.
- **Single-use submission:** once a session is `complete`, no further turns can be appended.
- **Topic coverage:** a `complete` session always has exactly 5 `scores` rows — one per topic (`typescript`, `react`, `python`, `ai`) plus `overall`.
- **Score range:** every score is an integer in `[1, 5]`.
- **Turn ordering:** turns for a session are strictly insert-ordered by `id`; replay must reproduce the conversation.
- **Failure shape:** expected failures return a JSON `{ error }` body with a typed code (`unauthorized` | `not_found` | `session_closed` | `interview_in_progress` | `results_not_ready` | `llm_failed` | `judge_failed`). No thrown 500s for expected paths.

## 🎓 Interview content

- **Topics, in order:** TypeScript → React → Python → AI.
- **Per-topic count:** ~3–4 questions from the bank per topic, with AI follow-ups allowed before advancing.
- **Total target duration:** ~15 minutes (~12–16 turns of substance).
- The question bank lives in `src/sessions/questions.ts` and is reviewed in git. Adding/removing questions is a code change, not an admin action.

## 📏 Scoring rubric (judge contract)

- Per topic (`typescript`, `react`, `python`, `ai`):
  - **1** — no working knowledge / wrong fundamentals
  - **2** — surface familiarity, struggles with non-trivial questions
  - **3** — solid working knowledge, gaps under pressure
  - **4** — strong, can reason about tradeoffs and edge cases
  - **5** — deep expertise, teaches the interviewer something
- **Overall** — judge's holistic rating using the same 1–5 anchors, not a strict average.
- Every score includes 1–3 sentences of `notes` citing the candidate's answers.

## 🔌 Entry point

All behavior is observable through the deployed `fetch` handler (`createApp(deps).fetch`). Specs MUST drive this handler with **both** a fake repository AND a scripted LLM client injected at the boundary — never the internal service functions alone, never the real Anthropic API.
