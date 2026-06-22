# 🎤 First-Run Interview

> 👋 **This file is both a guide and a sentinel.**
> While it sits in your project root, every new Claude Code session will
> greet you and offer to run the onboarding interview (a `SessionStart` hook
> checks for this exact file).
>
> **Three ways out:**
> - Run `/interview` — conduct the interview, fill in your `you/` skill, then
>   this file gets archived to `.claude/skills/you/interview-guide.md` and the
>   greeting goes quiet for good.
> - Delete this file — opt out forever, no interview.
> - Do nothing — you'll be asked again next session.

This is the script Claude follows during `/interview`. It exists so the
toolkit makes decisions that fit **you** instead of generic best-practice
mush. Editing the questions below changes the interview.

---

## 🧭 How to run this interview (instructions to Claude)

**Tone.** Warm, curious, senior-to-senior. The user is an experienced
programmer — don't explain what a database is. Do dig into *why* they prefer
what they prefer.

**Pacing.** Tell them up front this takes ~20 minutes and that it's worth it
because every command and agent reads the result. **Ask ONE question at a
time.** Wait for the answer before moving on. Never dump a questionnaire.

**Go deep — about 3 levels.** For each topic, start broad, then follow the
answer down with concrete, opinionated follow-ups. Offer suggestions rather
than open-ended prompts. Example chain:
1. "What languages do you reach for first?" → *Elixir*
2. "Phoenix for web, or Elixir for backend services behind something else?"
3. "LiveView-first, or do you keep a separate JS frontend? And OTP-heavy
   (GenServers, supervision trees) or mostly plain functional pipelines?"

**Make suggestions as you go.** When an answer implies a missing skill, offer
to create it:
- Likes a functional language (Elixir, Clojure, F#, Haskell) → "Want a
  functional-programming skill? I can copy `lang-template/` and seed it."
- Names a language with no skill yet (Python, Go, Rust, Ruby…) → offer to
  copy `lang-template/` → `<lang>-best-practices/`.
- Picks a DB that isn't Postgres/SQLite → offer a DB skill.
- Ships network-facing apps but wants to drop `security-web` → push back gently.
- Mentions a specific deploy target (Fly, Workers, Vercel, a VPS) → offer a
  deploy skill stub.

**Call out contradictions — don't paper over them.** If answers conflict,
name it and ask them to resolve it. Examples:
- "You said *ship fast, cut scope* but also *100% test coverage, no
  exceptions* — those fight each other. Which wins when they collide?"
- "You want *no build step* but also *TypeScript everywhere* — TS needs a
  compile. Did you mean Bun/Deno running TS directly, or a real build?"
- "You said *Postgres always, no exceptions* but the deploy target is
  Cloudflare Workers — Workers can't hold a Postgres socket pool without a
  proxy. Want to reconcile that?"

**One topic per section. Confirm before writing.** At the end of each section,
summarize what you heard in 2–3 bullets and get a yes before you write it to
a file.

---

## 📋 Sections & question seeds

Work through these in order. The seeds are starting points — adapt to their
answers and follow the 3-level rule.

### 1. Languages & runtimes  →  `you/tech.md`
- Primary language(s)? What do you reach for first, and for *what kind* of
  problem (web, CLI, data, systems)?
- Runtime / version manager preferences? (Bun vs Node, asdf, mise, rustup…)
- Languages you actively **refuse**? Why?
- *(suggestion hook)* Missing language skill → offer `lang-template/` copy.

### 2. Platform & deployment  →  `you/tech.md`
- Where do things run? (your laptop, a VPS, serverless, k8s, edge)
- Preferred deploy target for a new side project vs. a real product?
- Free-tier-first, or do you pay for DX from day one?
- Containers always, or only when forced?
- *(contradiction watch)* deploy target vs. DB/runtime choices above.

### 3. Data & persistence  →  `you/tech.md`
- Default database? Is it absolute ("Postgres always") or contextual?
- ORM / query-builder / raw SQL? Migrations tool?
- Where does session / cache / queue state live?
- *(suggestion hook)* non-Postgres/SQLite DB → offer a DB skill.

### 4. Testing & quality  →  `you/tech.md`
- Tests-first (BDD/TDD) or tests-after? Honestly?
- Runner of choice? (Bun test, Vitest, Jest, Playwright, ExUnit…)
- What do you actually test — units, integration, e2e? What do you skip?
- Coverage targets, or "test what's scary"?
- Linting / formatting / type-strictness bar?
- *(suggestion hook)* offer a testing skill if their runner has no home.

### 5. Architecture opinions & conventions  →  `you/tech.md`
- OO, functional, or "whatever fits"? (sets whether SOLID/GoF skills stay)
- Strong feelings: monolith vs. services, REST vs. RPC vs. GraphQL,
  code-gen, dependency injection, error handling (exceptions vs. Result)?
- What's a pattern you see teams cargo-cult that you refuse?
- Speed-to-ship vs. correctness — where's your line?
- *(contradiction watch)* this is where most conflicts surface.

### 6. Background & audience  →  `you/background.md`
- Who are you — role, years in, what you've built, where you work now?
- Who's the audience for what you build / write? (juniors, seniors, customers)
- What does "good" mean to *you* specifically vs. the average dev?

### 7. Writing voice  →  `you/writing.md`
- Sentence rhythm — terse and punchy, or longer and explanatory?
- Words / phrases you avoid? (corporate-speak, hype, em-dashes, emoji?)
- Tone — dry, warm, irreverent, formal?
- Show me by reaction: paste 2 short sample sentences in different voices and
  ask which is closer to theirs.

---

## ✅ When the interview is done (instructions to Claude)

1. Write the captured answers into the `you/` skill files — replace the
   bracketed placeholders in `background.md`, `tech.md`, `writing.md`. Be
   **directive and specific** ("Postgres in prod, always; no Mongo, ever"),
   not soft ("I prefer Postgres"). Delete sections that don't apply.
2. Seed `docs/MEMORY.md` standing decisions if `/init` has already run (see
   `you/memory-bootstrap.md`). If `docs/` doesn't exist yet, skip and tell
   them to run `/init` then `/interview` again to seed it.
3. Act on any skill suggestions they accepted (copy `lang-template/`, stub a
   DB / deploy / testing skill, prune skills they rejected).
4. **Clear the sentinel:** move this file out of the project root so the
   greeting stops firing:
   `mv INTERVIEW.md .claude/skills/you/interview-guide.md`
   (keeps the guide for future re-runs; the hook only checks the root).
5. Summarize what changed (files written, skills created/pruned) and point
   them at `/init` (if not run) or `/explore` to start the pipeline.
