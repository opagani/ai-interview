---
name: you
description: Personal context for the human running this toolkit — background, tech preferences, voice. Auto-surfaced so commands and agents make decisions that match who you are. EDIT THIS BEFORE YOUR FIRST RUN.
---

# About You

This skill is your **personal context file**. Other skills are horizontal
knowledge (SOLID, Postgres, security). This one is *you* — the specific human
the AI is working for. Fill in the three files below and the whole toolkit
starts making decisions that fit you instead of generic best-practice mush.

## Files

- `background.md` — who you are, what you've built, where you work, audience.
  Used when the AI needs to frame explanations, write copy in your voice, or
  judge what "good" means for *you* vs the average dev.
- `tech.md` — your stack rules. Languages you prefer, databases you insist on,
  frameworks you refuse, what you'll trade for shipping speed, what you won't.
  This is **directive**, not suggestion. The /design and /plan commands lean
  on it hard.
- `writing.md` — your voice. Sentence rhythm, words you avoid, tone. Used
  whenever the AI drafts a README, PR description, commit body, or any
  long-form prose under your name.

## How to fill them in

Open each file. Replace the bracketed placeholders with the real thing. Be
opinionated and specific — "I prefer Postgres" is weaker than "Postgres in
prod, always; no Mongo, no Dynamo, ever." The AI follows strong rules
better than soft preferences.

If a section doesn't apply to you, **delete it** rather than leaving a vague
placeholder. Empty is better than confusing.

## When to update

- After a project where the AI made a call you disagreed with — write the rule
  it should have followed.
- When your stack genuinely changes (new language, new deployment target).
- When you change audience (writing for juniors vs seniors changes voice).
