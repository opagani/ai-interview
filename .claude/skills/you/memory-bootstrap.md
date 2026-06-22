# MEMORY.md — Starter Decisions

When `/init` scaffolds a project, `docs/MEMORY.md` is born empty. That's
fine, but most projects start with 2–3 decisions already made (your stack,
your DB, your deploy target). Seeding the file with them on day one means
later phases stop re-litigating.

Below is a starter block you can paste into a fresh `docs/MEMORY.md`. Edit
the bracketed bits to match the project. Each entry is dated, attributed
to a phase or human, and ends with a one-line *why*.

---

```md
# 🧠 Memory

The project's decision log. Append a dated entry whenever a decision is
made. Curated by `/document`.

## Standing decisions (seeded at /init)

### [2026-06-02] Language & runtime — [TypeScript on Bun]
- **Why:** [matches your `you/tech.md` default; free-tier deployable]
- **Reconsider when:** [we need a runtime feature Bun doesn't have]

### [2026-06-02] Database — [SQLite local, Postgres prod]
- **Why:** [from `you/tech.md`; SQLite ports cleanly via Drizzle]
- **Reconsider when:** [write throughput exceeds single-writer ceiling]

### [2026-06-02] Deploy target — [Cloudflare Workers free tier]
- **Why:** [zero cost until traffic; aligns with the project budget]
- **Reconsider when:** [we need >10ms CPU per request or persistent sockets]

## Phase entries

<!-- /explore, /design, /plan, /build-loop, /document each append here -->
```

---

## How to use

1. After `/init`, open `docs/MEMORY.md`.
2. Paste the block above between the heading and the phase entries section.
3. Edit the three standing decisions to reflect *this* project (or delete
   ones that don't apply).
4. From here on, every phase command appends — never rewrites — entries.
