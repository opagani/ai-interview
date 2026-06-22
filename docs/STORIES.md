<!-- Owner: /plan — do not edit from other phase commands. -->

# 📚 User Stories — TechScreen

> Canonical backlog. Consumed by the `bdd-specs` skill: each Story becomes a Feature, each acceptance criterion becomes a Scenario, each `Then` becomes one Specification.

## Definition of Ready

A story is ready when:
- The role, capability, and value are all stated and non-hollow.
- Acceptance criteria exist in Given/When/Then form, covering the happy path.
- Out-of-scope notes make the boundary explicit.
- Small enough that its criteria can be enumerated (passes INVEST).

## Definition of Done

A story is done when:
- All acceptance criteria pass as executable specs (via `bdd-specs`).
- Edge/error criteria are covered, not just the happy path.
- Wire task is green: feature is reachable through the deployed `fetch` handler.

---

## Epic: Candidate Interview Lifecycle

End-to-end self-serve candidate interview — from link creation through scored results.

---

### STORY-1 — Create a candidate session

As an **interviewer (admin)**,
I want **to generate a unique interview link for a candidate via the API**,
so that **the candidate can self-serve and their results are tied to that link**.

**Size:** S  ·  **Status:** ready

**Acceptance criteria**

_Happy path:_

```
AC1 — Admin creates a session
  Given a request to POST /api/sessions with a valid admin bearer token
  When  the system handles it
  Then  the response status is 201

AC2 — Token is returned
  Given the same request
  When  the system handles it
  Then  the response body has a non-empty `token` field

AC3 — URL is returned
  Given the same request
  When  the system handles it
  Then  the response body's `url` equals `{baseUrl}/interview/{token}`

AC4 — Session is persisted as pending
  Given the create request succeeded
  When  the session is looked up by its token
  Then  the session exists with status `pending`

AC5 — Tokens are unique
  Given two successive create requests with the same admin token
  When  both responses are read
  Then  the two `token` values are different
```

_Sad path:_

```
AC6 — Rejects missing admin token
  Given a request to POST /api/sessions with no Authorization header
  When  the system handles it
  Then  the response status is 401 and the body is { error: "unauthorized" }

AC7 — Rejects invalid admin token
  Given a request to POST /api/sessions with a wrong bearer token
  When  the system handles it
  Then  the response status is 401 and no session is persisted
```

**Out of scope:** candidate name capture beyond echoing it; email delivery of the link; admin UI; session listing/search.

---

### STORY-2 — Open the interview UI

As a **candidate**,
I want **opening my link to show me a working chat page**,
so that **I can take the interview without installing anything**.

**Size:** S  ·  **Status:** ready

**Acceptance criteria**

_Happy path:_

```
AC1 — Valid token serves the chat page
  Given a session was created with token T
  When  I GET /interview/T
  Then  the response status is 200

AC2 — Response is HTML
  Given the same request
  When  the response is read
  Then  its Content-Type starts with "text/html"

AC3 — Complete session shows results page
  Given a session with token T whose status is `complete`
  When  I GET /interview/T
  Then  the response status is 200 and the body contains the candidate's results
```

_Sad path:_

```
AC4 — Unknown token responds 404
  Given no session exists with token X
  When  I GET /interview/X
  Then  the response status is 404
```

**Out of scope:** styling/branding; mobile-specific UI; accessibility audit (covered by general HTML defaults only).

---

### STORY-3 — Submit a turn

As a **candidate**,
I want **to send my answer and get the interviewer's next question**,
so that **I can progress through the interview one turn at a time**.

**Size:** M  ·  **Status:** ready

**Acceptance criteria**

_Happy path:_

```
AC1 — Opening turn fetches first question
  Given a pending session with token T
  When  I POST /api/sessions/T/turns with { answer: null }
  Then  the response status is 200

AC2 — Assistant message is returned
  Given the same opening request
  When  the response is read
  Then  the body's `assistant` field is a non-empty string

AC3 — Session moves to active
  Given the opening request succeeded
  When  the session is looked up
  Then  its status is `active`

AC4 — User turn is persisted
  Given an active session and a request with answer "my answer text"
  When  the request is handled
  Then  the session's turn log contains a user turn with content "my answer text"

AC5 — Assistant turn is persisted
  Given the same request
  When  the request is handled
  Then  the session's turn log contains an assistant turn after the user turn

AC6 — isComplete is false mid-interview
  Given the question bank is not exhausted
  When  a turn is submitted
  Then  the response body's `isComplete` is false

AC7 — isComplete is true when bank is exhausted
  Given the previous turn was the final scripted question
  When  the candidate submits the final answer
  Then  the response body's `isComplete` is true

AC8 — Status flips to awaiting_scoring
  Given the response indicated isComplete=true
  When  the session is looked up
  Then  its status is `awaiting_scoring`

AC9 — Topic is reported
  Given any successful turn
  When  the response is read
  Then  the body's `topic` is one of "typescript" | "react" | "python" | "ai"
```

_Sad path:_

```
AC10 — Unknown token responds 404
  Given no session with token X exists
  When  I POST /api/sessions/X/turns with any body
  Then  the response status is 404 and the body is { error: "not_found" }

AC11 — Closed session rejects new turns
  Given a session with status `complete`
  When  I POST a turn to its endpoint
  Then  the response status is 409 and the body is { error: "session_closed" }

AC12 — Awaiting-scoring session also rejects new turns
  Given a session with status `awaiting_scoring`
  When  I POST a turn to its endpoint
  Then  the response status is 409

AC13 — LLM failure does not persist a half-turn
  Given the LLM client throws on the next call
  When  a turn is submitted
  Then  the response status is 502 with { error: "llm_failed" }

AC14 — Failed-turn rollback
  Given the same LLM failure
  When  the session's turn log is read after the failed call
  Then  no new user or assistant turn was appended for that attempt
```

**Out of scope:** streaming responses; cancellation mid-turn; per-IP rate limiting.

---

### STORY-4 — Complete and score the interview

As an **interviewer**,
I want **the system to grade the candidate against a rubric once the interview ends**,
so that **I get a comparable per-topic score without reading the whole transcript**.

**Size:** M  ·  **Status:** ready

**Acceptance criteria**

_Happy path:_

```
AC1 — Completing returns 200
  Given a session with status `awaiting_scoring`
  When  I POST /api/sessions/T/complete
  Then  the response status is 200

AC2 — Five scores are returned
  Given the same request
  When  the response is read
  Then  the body's `scores` array has exactly four entries with topic in {typescript, react, python, ai}

AC3 — Overall score is returned
  Given the same request
  When  the response is read
  Then  the body's `overall.score` is an integer between 1 and 5 inclusive

AC4 — Per-topic scores are in range
  Given the same response
  When  each score is inspected
  Then  every `score` field is an integer between 1 and 5 inclusive

AC5 — Notes accompany each score
  Given the same response
  When  each score is inspected
  Then  every score has a non-empty `notes` string

AC6 — Scores are persisted
  Given the complete call succeeded
  When  the scores table is queried by session id
  Then  it contains exactly 5 rows (4 topics + overall)

AC7 — Status flips to complete
  Given the complete call succeeded
  When  the session is looked up
  Then  its status is `complete` and `completed_at` is set

AC8 — Idempotent on completed sessions
  Given a session already in status `complete`
  When  I POST /api/sessions/T/complete again
  Then  the response is 200 with the previously persisted scores and the judge is not invoked again
```

_Sad path:_

```
AC9 — Pending session cannot be completed
  Given a session with status `pending`
  When  I POST its complete endpoint
  Then  the response status is 409 with { error: "interview_in_progress" }

AC10 — Active session cannot be completed
  Given a session with status `active`
  When  I POST its complete endpoint
  Then  the response status is 409

AC11 — Judge failure surfaces as 502
  Given the judge LLM call fails twice
  When  I POST the complete endpoint
  Then  the response status is 502 with { error: "judge_failed" }

AC12 — Judge failure leaves session in awaiting_scoring
  Given the same judge failure
  When  the session is looked up
  Then  its status is still `awaiting_scoring` so it can be retried
```

**Out of scope:** custom rubrics per role; manual score override; weighting topics differently.

---

### STORY-5 — Read interview results

As **either an interviewer or a candidate (with the link)**,
I want **to fetch the final scores for a completed interview**,
so that **the result is readable after the session ends**.

**Size:** S  ·  **Status:** ready

**Acceptance criteria**

_Happy path:_

```
AC1 — Complete session returns scores
  Given a session with status `complete` and persisted scores
  When  I GET /api/sessions/T/results
  Then  the response status is 200

AC2 — Same shape as complete response
  Given the same request
  When  the response is read
  Then  the body has `scores` (4 entries) and `overall` (one entry)

AC3 — Topics are present
  Given the same response
  When  the `scores` array is read
  Then  it contains exactly the topics {typescript, react, python, ai}
```

_Sad path:_

```
AC4 — Unknown token responds 404
  Given no session with token X exists
  When  I GET /api/sessions/X/results
  Then  the response status is 404 and the body is { error: "not_found" }

AC5 — Pending session is not yet ready
  Given a session with status `pending`
  When  I GET its results endpoint
  Then  the response status is 409 with { error: "results_not_ready" }

AC6 — Awaiting-scoring session is not yet ready
  Given a session with status `awaiting_scoring`
  When  I GET its results endpoint
  Then  the response status is 409
```

**Out of scope:** access logging; differential views (candidate-safe vs interviewer-only); CSV export.
