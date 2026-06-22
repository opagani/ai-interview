# Stack

- Language: TypeScript, exclusively. Runtime: Bun (dev/test/tooling). No build step where avoidable. # noqa: E999
- DB: SQLite local → Cloudflare D1 prod, via Drizzle ORM + drizzle-kit migrations. D1 holds sessions/cache too until
  that hurts.
- Deploy: Cloudflare Workers, free-tier-first. Write Workers-compatible code (Web APIs) — no Bun-only server APIs in
  shipped code. Containers only when forced.

Architecture

- Functional-leaning, light OO — pure functions + modules first, classes only when they earn it. SOLID/GoF are
  references, not gospel.
- REST/HTTP APIs. Result/typed errors for expected failures over throwing.
- Tests-first (BDD/TDD with bun:test, units + integration) on load-bearing behavior — no coverage-% chasing. Strict TS
  is the hard gate.
- Flat, obvious, layered project structure. Shallow nesting.

Trade-offs

- Sacrifice for speed: abstractions, test breadth, review polish.
- Never sacrifice: data integrity, security.
- You read every line → optimize for human readability.
