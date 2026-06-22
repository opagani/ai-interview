# Project

> 📌 TODO: one-line project summary. Defined by `/explore` → `docs/PROJECT.md`.

## 🛠️ Stack

- **Language:** TypeScript only.
- **Runtime:** Bun (dev/test/tooling). No build step where avoidable.
- **DB:** SQLite + Drizzle locally → Cloudflare D1 in prod.
- **Deploy:** Cloudflare Workers, free-tier-first. Ship Workers-compatible
  (Web API) code — no Bun-only server APIs in prod.

## 📐 Conventions

- Functional-leaning, light OO. Pure functions/modules first; classes only
  when they earn it.
- REST/HTTP APIs. Result/typed errors for expected failures, not throwing.
- Strict TypeScript (no `any`) — the hard gate.
- Flat, obvious project layout. Shallow nesting, grouped by concern.
- Tests-first (BDD/TDD) on load-bearing behavior. Cover what's risky, don't
  chase coverage %.
- Never sacrifice data integrity or security. Polish/abstractions are
  negotiable.

## ▶️ Commands

- **Test:** `bun test` — TODO: confirm once code exists.
- **Run:** TODO: confirm once code exists.

## 🔁 Phase commands (one owner per doc)

- `/explore` → owns `docs/PROJECT.md` (what & why)
- `/design` → owns `docs/ARCHITECTURE.md` + `docs/SPEC.md`
- `/plan` → owns `docs/STORIES.md` + `docs/PLAN.md`
- `/document` → owns `README.md` + curates `docs/MEMORY.md`

Each doc has exactly one owner command. Don't write someone else's file.

## 📏 Rules

- DO NOT REPORT SOMETHING IS FIXED IF YOU HAVEN'T COMPILED THE APP
- DO NOT SEARCH node_modules for answers. GO ONLINE.
- Use emoji for markdown documents for readability.
- Get to the point, be terse, do not over explain. Tokens are water, we're in
  the desert. Use emoji instead of prose if you can.
- Never install a package by editing the manifest, always use a package
  install tool, such as `bun install`.
