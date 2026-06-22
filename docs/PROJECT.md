<!-- Owner: /explore — do not edit from other phase commands. -->

# 📖 Project — TechScreen

## ❓ Problem

Hiring engineers is slow. Phone screens waste time on both sides when the candidate's actual depth in TypeScript, React, Python, and AI is unknown going in. TechScreen replaces the first technical screen with an AI chatbot interview — candidates take it on their own time via a link, it adapts to their answers, and returns a score.

## 👥 Who it's for

- **For:** an independent engineer or small team hiring for roles requiring TypeScript, React, Python, and/or AI knowledge.
- **Not for:** large HR departments, non-technical roles, or interviews needing human judgment mid-session.

## 🎯 Goals

1. Send a candidate a link — they take the interview unassisted.
2. The AI conducts a conversational, adaptive interview across the four topics.
3. The candidate receives a score/grade per topic at the end.

## ✅ Success (observable)

- A candidate opens a link, completes a full interview without any human involvement.
- The system scores each topic area and presents results at session end.
- Interview quality is good enough to surface real knowledge gaps (not gameable by keyword-matching).

## 🚧 Scope

**In:** interview bot, adaptive questioning across TypeScript / React / Python / AI, per-topic scoring, self-serve candidate link.

**Out:** recruiter dashboard, candidate management, custom question sets, auth/accounts, scheduling, video/audio, cheating detection, team collaboration.

## 🧱 Constraints

- TypeScript on Bun (dev/test); ships Workers-compatible code (Web APIs).
- SQLite + Drizzle locally → Cloudflare D1 in prod. Free-tier-first.
- REST + Result/typed errors. Strict TS. Tests-first.
- AI usage costs must stay negligible at MVP scale (few candidates/day).

## ⚠️ Riskiest unknowns

- Can a single AI conversation session reliably assess depth vs. surface knowledge across 4 topics without becoming too long?
- How do we score open-ended answers consistently? (rubric design is hard)

## 🔍 Open questions

- TODO: Who sees the score — candidate only, interviewer only, or both?
- TODO: Target interview duration? (sets question count and depth per topic)
- TODO: Scoring schema — 1–5 per topic? overall %? hire/no-hire signal?
- TODO: How is the candidate link generated and distributed — manual, API, or email integration?
- TODO: What model powers the interview? (Claude claude-opus-4-8 implied by stack but not decided)
