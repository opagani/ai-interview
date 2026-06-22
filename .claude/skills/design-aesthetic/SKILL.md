---
name: design-aesthetic
description: Your project's visual identity — color tokens, typography, spacing, components, motion. Auto-surfaced when generating any UI. EDIT THIS BEFORE YOUR FIRST UI BUILD or the AI will default to generic Tailwind dashboard mush.
---

# Your Design Aesthetic

The horizontal best-practice skills (`typescript-best-practices`,
`security-web`, etc.) cover *correctness*. This skill covers *what good
looks like* for **your** projects.

Fill it in. If you don't, every UI Claude generates will look like a
default shadcn dashboard, and you'll spend the rest of the project fighting
it.

---

## North-star references

[Paste 3–5 links to sites/apps whose look you're chasing. Be specific:
"linear.app for the typography, stripe.com for the gradients, the Notion
empty states." Don't just say "modern" — show.]

- [example.com](https://example.com) — for [what specifically]
- [example.com](https://example.com) — for [what specifically]

## Aesthetic in one sentence

[e.g. "Warm, atmospheric, tactile — Bauhaus colors at SaaS density." If you
can't compress it to one sentence, you don't know it yet.]

## Color tokens

```css
/* Replace with your real tokens */
--bg:        #[hex];   /* page background */
--surface:   #[hex];   /* cards, panels */
--text:      #[hex];   /* body */
--text-mute: #[hex];   /* secondary */
--accent:    #[hex];   /* primary action */
--accent-2:  #[hex];   /* highlight */
--danger:    #[hex];
--success:   #[hex];
```

Notes on usage: [when to reach for accent vs accent-2, when surface beats
bg, etc.]

## Typography

- **Display / headings:** [font, source, fallback stack]
- **Body:** [font, fallback]
- **Mono:** [font, fallback]
- **Scale:** [e.g. modular scale 1.25, base 16px → 16/20/25/31/39/49/61]
- **Weights:** [which weights actually load — fewer is better]

## Spacing & layout

- **Base unit:** [4px / 8px]
- **Grid:** [12-col / 8-col / golden-ratio bento]
- **Max content width:** [px or ch]
- **Density:** [tight / comfortable / airy — pick one and mean it]

## Motion

[When things animate, how, and how *fast*. Defaults to avoid: 300ms
ease-in-out on every hover. State the project's motion language.]

- **Easing:** [tokens]
- **Durations:** [tokens — 80ms / 160ms / 280ms]
- **What never animates:** [list]

## Component conventions

- **Buttons:** [shape, size scale, hover behavior, disabled state]
- **Cards:** [shadow vs. border, radius, padding]
- **Forms:** [label position, validation timing, error display]
- **Empty states:** [tone, illustration policy, always include a CTA?]

## Anti-patterns (the AI must NOT produce these)

- [e.g. default Tailwind gray-900 / gray-100 backgrounds]
- [e.g. drop-shadow-2xl on everything]
- [e.g. emoji as feature icons]
- [e.g. centered hero with a gradient blob]
- [e.g. SaaS-y "Trusted by" logo strip]

## When the AI must stop and ask

[List the moments where you want a checkpoint instead of a guess — color
choice for a new section, naming a new component, choosing iconography,
etc.]
