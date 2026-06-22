# Your Tech Profile

**Purpose:** Directive reference for any AI agent working on your behalf.
These are not suggestions. They are how you work.

---

## Stack

**Language:** TypeScript, exclusively. No other languages — don't scaffold
Python/Go/etc. unless explicitly asked.

**Runtime:** Bun — for dev, test, and tooling. Avoid a build step wherever
possible (Bun runs TS directly).

**Database (development/testing):** SQLite via Drizzle.

**Database (production):** Cloudflare D1 (edge SQLite). NEVER list: a
Postgres-on-Workers setup requiring a socket proxy — stay edge-native.

**ORM / query layer:** Drizzle ORM + drizzle-kit for migrations. Not Prisma,
not raw SQL by default.

**Session / cache / queue state:** D1 for everything until that genuinely
hurts. Don't reach for KV/Durable Objects/Queues prematurely.

**Frameworks you reach for:** Workers-compatible code using Web standard APIs.

**Frontend:** Keep it light.

**Deploy target:** Cloudflare Workers, free-tier-first. Write
Workers-compatible code (Web APIs) — **no Bun-only server APIs (`Bun.serve`,
Node sockets) in shipped code.** Bun is dev/test/tooling only; prod runs on
V8 isolates.

**Cost posture:** Free-tier-first. Stay on free tiers until traffic forces an
upgrade.

**Containers:** Only when forced. Workers/serverless don't need them.

---

## Architecture priorities

1. **Data integrity is sacred.** Never compromised.
2. **Security is non-negotiable** — this ships network-facing edge apps.
3. **Obvious project layout** — flat, shallow nesting, grouped by concern.

Everything else is the AI's call.

---

## Paradigm & conventions

- **Functional-leaning, light OO.** Pure functions + modules first; reach for
  classes only when they clearly earn it. SOLID/GoF are references, not gospel.
- **APIs:** REST/HTTP.
- **Errors:** Result / typed errors for *expected* failures over throwing.
  Throw only for truly exceptional cases.
- **Strict TypeScript** is the hard quality gate (tsconfig strict, no `any`).

---

## Project structure

Flat and obvious. Shallow nesting. Group by concern (e.g. `services/`,
`models/`, `routes/`). Clean root. Layout should be obvious at a glance.

---

## Testing

- **Tests-first (BDD/TDD).** Write specs before implementation for
  load-bearing behavior.
- **Runner:** `bun:test`.
- **Coverage:** units + integration. Cover what's load-bearing/risky — do NOT
  chase a coverage %. TDD the parts that matter, not coverage theater.
- e2e only for critical flows.

---

## What you'll sacrifice for shipping speed

Abstractions, test breadth, review/code polish.

## What you will NEVER sacrifice

Data integrity. Security.

---

## How you read code

**You read every line.** Optimize for human readability — clear names, obvious
control flow, comments only where they earn their place.

---

## Decision-making priorities (when trade-offs collide)

1. Data integrity & security.
2. Correctness of the data model.
3. Ship fast (cut polish, not correctness).
4. Everything else.
