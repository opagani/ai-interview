# 🚀 Claude Code Starter Template

A ready-to-use `.claude/` directory that turns Claude Code into a disciplined,
phased software-development pipeline. Drop it into a project and you go from
a one-line idea to committed, reviewed code through a series of slash
commands — each owning one document, each re-runnable, none stepping on the
others.

This is the same toolkit I (Rob Conery) use day to day, with my personal
context stripped out and replaced with templates for you to fill in.

> 🎥 **Companion video series:** this template is what you'll build alongside
> the videos. I'm still working on this.

---

## 🔗 ShortLink demo — running it for real

> This repo contains a DEMO URL shortener (`/links` shorten, `/{slug}` redirect,
> `/api/links/{slug}/stats`) built as a walkthrough of the toolkit pipeline.
> All 19 specs pass. Here's how to take it from green tests to a live Worker.

### Prerequisites

- [Bun](https://bun.sh) installed (`bun --version`)
- [Cloudflare account](https://dash.cloudflare.com) (free tier is enough)
- `bunx wrangler login` done at least once

### 1 — Create the D1 database

```bash
bunx wrangler d1 create shortlink
```

Copy the `database_id` it prints and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
database_id = "paste-id-here"   # ← replace REPLACE_ME
```

### 2 — Generate and apply the migration

```bash
bun run db:generate          # schema.ts → drizzle/*.sql
```

> ⚠️ Open the generated `.sql` file and add `) STRICT;` to the end of each
> `CREATE TABLE` statement before applying — drizzle-kit won't do this for you.

```bash
bun run db:migrate:local     # apply to local D1 (for wrangler dev)
```

### 3 — Run locally

```bash
bun run dev                  # wrangler dev → http://localhost:8787
```

```bash
# Shorten a URL
curl -i -X POST localhost:8787/links \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com"}'
# → 201 { slug, shortUrl, targetUrl }

# Follow the redirect
curl -i localhost:8787/<slug>
# → 302 Location: https://example.com

# Check stats
curl localhost:8787/api/links/<slug>/stats
# → 200 { slug, targetUrl, clicks }
```

### 4 — Deploy to Cloudflare

```bash
bun run db:migrate           # apply migration to prod D1
bun run deploy               # wrangler deploy
```

Set `BASE_URL` in the Cloudflare dashboard (Workers → Settings → Variables)
to your `workers.dev` subdomain, e.g. `https://shortlink-demo.yourname.workers.dev`.

### Run tests (no D1 needed)

```bash
bun test   # 19 pass / 0 fail — fake in-memory repo, no network required
```

---

## 🎯 Guiding principle: Design for Change

Every command, agent, and skill here serves one principle: **the goal of
writing software is to be able to change it safely.** SOLID, GoF,
coupling/cohesion, BDD specs, schema conventions — they're all tactics
in service of that goal. Read every artifact through this lens: if a
rule doesn't make the next change easier, it's the wrong rule.

---

## 🧭 What's in the box

```
your-project/
├── INTERVIEW.md            # first-run interview guide + sentinel
└── .claude/
    ├── settings.json       # live: safe command allowlist
    ├── settings.example.json  # optional hooks (prettier, block .env) to merge
    ├── commands/           # slash commands (phase pipeline + git helpers)
    ├── agents/             # builder + reviewer subagents (used by /build-loop)
    └── skills/             # horizontal knowledge skills, auto-surfaced by description
```

### The phase pipeline

```
/init ──▶ /explore ──▶ /design ──▶ /plan ──▶ /spec ──▶ /build-loop
            (problem)    (solution)  (tasks)   (specs)    (code)

/document ── run anytime; reconciles docs ↔ reality
/quick-fix ── small, obvious fixes; skips the pipeline
```

Each command owns **one** document. Re-running a command refines its doc; it
never clobbers another command's output.

| Command | Owns | Question it answers |
|---|---|---|
| `/init` | `CLAUDE.md`, `docs/` skeleton | What files do we need? |
| `/explore` | `docs/PROJECT.md` | What problem, for whom, why? |
| `/design` | `docs/ARCHITECTURE.md`, `docs/SPEC.md` | How do we build it? |
| `/plan` | `docs/STORIES.md`, `docs/PLAN.md` | What tasks, in what order? |
| `/spec` | spec files | Pending BDD specs from stories |
| `/build-loop` | the code + git history | Build it. |
| `/document` | `README.md`, `docs/MEMORY.md`, ARCHITECTURE prose | Do the docs still match the code? |

### The agents

`/build-loop` is the only command that writes feature code. It dispatches
two subagents:

- **`builder`** (sonnet) — implements one PLAN.md task, runs tests, reports.
  Stays in its files. Never commits unless told.
- **`reviewer`** (opus) — read-only gate. Returns `PASS` or `FAIL`. **Has no
  edit tools by design** — a gate that can fix itself isn't a gate.

The reviewer is intentionally a stronger model than the builder.

### The skills

Skills are markdown files that auto-load when a task description matches.
Some are horizontal ("every programmer needs this"), some are stack-specific
("only if you use Postgres"). See the **Pick your skills** section below.

---

> 🏃 **Just want to start?** See [QUICKSTART.md](./QUICKSTART.md) — four
> commands, five minutes.

## ⚡ Install

From the project you want to use this in:

```bash
# 1. Copy .claude AND the root INTERVIEW.md into your project
cp -r path/to/this/.claude /your/project/
cp path/to/this/INTERVIEW.md /your/project/

# 2. Open Claude Code in that project
cd /your/project && claude
```

That's it. Slash commands and skills are auto-discovered. Run `/interview`
first to personalize the toolkit (see below). Keep `INTERVIEW.md` at the
**project root** — that's the sentinel `/init` checks to remind you if you
haven't run the interview yet.

The template ships a live `.claude/settings.json` (safe command allowlist).
For the optional extras — prettier-on-edit, block `.env` writes — see
`.claude/settings.example.json` and merge what you want.

**Optional but recommended:**
- Copy this repo's `.gitignore` into your project (or merge it).

---

## 🎤 First run: the onboarding interview

The template ships an `INTERVIEW.md` at the root as a sentinel. Just run
`/interview` to personalize the toolkit — and while that file is present,
`/init` reminds you to run the interview before scaffolding. Your options:

- **Run it** — `/interview` walks you through a ~20-minute, one-question-at-a-time
  interview (languages, platform, testing, opinions, writing voice), fills in
  your `you/` skill, suggests skills to add, then archives `INTERVIEW.md` so the
  reminder goes quiet.
- **Opt out** — delete `INTERVIEW.md` and fill in `you/` by hand.

The interview is the guided path through the checklist below — running it
covers step 1 (and offers to do 2–3) for you.

---

## 🎯 First-run checklist

Do these **before** you run your first phase command (or just run `/interview`,
which walks you through them):

1. **Fill in your personal context.** Open `.claude/skills/you/` and edit the
   three files (`background.md`, `tech.md`, `writing.md`). Be opinionated —
   strong rules ("Postgres in prod, always") work better than soft preferences.

2. **Prune skills you won't use.** See the table below. Deleting unused
   skills keeps the AI from getting distracted.

3. **Decide your stack.** The template ships with both `postgres-dba` and
   `sqlite-dev`. Pick one. Same with `typescript-best-practices` — delete it
   if you're a Python shop.

4. **Run `/init`** in your project to scaffold `CLAUDE.md` and `docs/`.

Then start the pipeline with `/explore`.

---

## 🧱 Pick your skills

| Skill | Keep if… | Drop if… |
|---|---|---|
| `solid-principles` | You write OO code in any language | You're doing pure FP / scripts |
| `design-principles` | Always — horizontal | Never |
| `gof-patterns` | You write OO code | Pure FP |
| `typescript-best-practices` | You write TS or JS | You don't |
| `postgres-dba` | Postgres in prod | Different DB |
| `sqlite-dev` | Local dev on SQLite with Bun | Different stack |
| `security-web` | You ship anything network-facing | Pure CLI / offline tooling |
| `user-stories` | You want structured backlog grooming | You hate ceremony |
| `bdd-specs` | You want tests-first | You write tests after |
| `agent-teams` | You'll run parallel agents | Solo serial loop is enough |
| `github` | You use git + GitHub | You don't |

---

## 🎨 What ships, what you fill in

Some scaffolds are already here for the most common gaps — fill them in,
don't re-invent them:

- 🐍 **`lang-template/`** — copy this skill folder + rename to
  `python-best-practices/` (or Go/Rust/Ruby/Elixir). The frontmatter and
  section headings are pre-filled.
- 🎨 **`design-aesthetic/`** — color tokens, typography, spacing, motion,
  anti-patterns. Edit before your first UI build or the AI defaults to
  generic Tailwind.
- 🧠 **`you/memory-bootstrap.md`** — a starter block to paste into
  `docs/MEMORY.md` after `/init`, so day-one decisions (stack, DB, deploy)
  are written down instead of re-litigated.

Still worth adding yourself when a real project needs them:

- 🗄️ **Database skill** for your actual DB — MySQL, MongoDB, DynamoDB, etc.
- 🔐 **Auth / billing / infra skills** for the services you actually use —
  Stripe, Clerk, Supabase, AWS, Cloudflare, etc.
- 🧪 **Testing skill** — Vitest? Jest? Bun's runner? Playwright? Pick one
  and write down the conventions so the builder agent stops guessing.
- 🚀 **Deploy skill** — Vercel? Workers? Fly? A VPS? The build-loop ends
  with a commit; deploy is a separate concern, but it should have a home.

> 💡 **My suggestion:** start lean. Use it on a real project, notice every
> time the AI guesses wrong, and write a skill that prevents that specific
> wrong guess. Don't try to author skills speculatively — they get stale and
> you stop trusting them.

---

## 🛠️ Customizing

### Adding a slash command

Drop a markdown file in `.claude/commands/`. The filename becomes the
command name (`docs.md` → `/docs`). Frontmatter:

```yaml
---
description: One-liner that shows up in the picker
---
```

Then write the prompt. Be explicit about: what the command owns, what it
reads, what stops it (missing inputs), and what it produces.

### Adding a skill

Skills live in `.claude/skills/<name>/SKILL.md`. The `description` in
frontmatter is **everything** — it's how Claude decides whether to surface
the skill. Be specific about *when* to use it ("when reviewing Postgres
schemas" beats "Postgres stuff").

### Adding an agent

Agents live in `.claude/agents/<name>.md`. Used for sub-tasks the main
session shouldn't be doing itself — long research, dedicated review,
parallel work. The `builder`/`reviewer` pair here is a template for the
loop pattern; copy it if you want, say, a `migration-writer` + `db-reviewer`
pair.

---

## 🧩 Conventions worth keeping

- **One owner per document.** Every doc has exactly one command that writes
  it. If you find yourself editing PROJECT.md from `/design`, stop and ask
  why `/explore` didn't capture it.
- **Re-entrant phases.** Re-running `/plan` should refine, not restart. Never
  drop completed `- [x]` tasks.
- **Stop, don't guess.** If a phase is missing its input, it should stop and
  point back at the owning command — not invent the missing piece.
- **Model choice is deliberate.** Heavy thinking → opus. Execution → sonnet.
  Quick git plumbing → haiku. Pay attention to the `model:` lines.

---

## 🤔 What you might be missing (a quick gut-check)

Things this template **doesn't** decide for you, that you'll want to think
about:

- 🔑 **Auth model.** Single-tenant? Multi-tenant? Sessions? JWTs? Magic links?
- 💳 **Billing model.** One-time? Subscription? Usage-based?
- 🌍 **Where does state live?** Local SQLite for the demo, Postgres in prod,
  KV for sessions — write it down in `you/tech.md` so the AI stops guessing.
- 📊 **Observability.** Logs, metrics, traces — none of the phases set this
  up. Worth a skill or a `/observability` command.
- 🚦 **CI.** The build-loop runs tests locally and commits on PASS. CI is
  separate and not opinionated here — add a `.github/workflows/` skill if you
  want one.
- 🎬 **The first 5 minutes of a project.** If `/init` feels heavy for a
  one-file experiment, that's what `/quick-fix` is for. Use the right tool.

---

## 📖 Further reading

The deep dive on each command, agent role, and the build-loop orchestration
pattern lives in `.claude/README.md`. Read that next.
