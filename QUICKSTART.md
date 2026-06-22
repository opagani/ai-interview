# ⚡ Quickstart

Copy it in, run the interview, start the loop.

```bash
# 1. Copy the toolkit + the root INTERVIEW.md into your project
cp -r path/to/this/.claude /your/project/
cp path/to/this/INTERVIEW.md /your/project/

# 2. Open Claude Code there
cd /your/project && claude
```

Run `/interview` to get started — it personalizes the toolkit to you. Then,
inside Claude Code:

```
/interview           # ~20 min: personalize the toolkit (or skip — it re-asks)
/init my-project     # scaffold CLAUDE.md + docs/
/explore             # talk through what you're building
/design              # decide how to build it
/plan                # slice into tasks
/build-loop          # build, review, commit — task by task
```

That's the whole loop. Re-run any command anytime to refine its doc.

**Personalizing:** `/interview` fills in `.claude/skills/you/`
(`background.md`, `tech.md`, `writing.md`) — the AI reads these to make
decisions that fit *you*. Prefer to do it by hand? Edit those files directly
and delete `INTERVIEW.md` to silence the prompt.

**Full docs:** [README.md](./README.md)
