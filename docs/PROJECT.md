<!-- Owner: /explore — do not edit from other phase commands. -->

# 📖 Project — ShortLink (DEMO)

> 🧪 **This is a cohort DEMO**, chosen by the assistant because no real idea
> was supplied — a URL shortener was picked to exercise the full pipeline on
> the user's stack (TS/Bun, SQLite→D1 Workers). When you have a real project,
> re-run `/explore` and it overwrites this file.

## ❓ Problem

People share long, ugly URLs (tracking params, deep paths) in places where
space and trust matter — chat, print, slides. Today they paste the raw URL or
reach for a third-party shortener that owns their links and data. ShortLink is
a tiny self-hosted shortener: turn a long URL into a short slug, redirect on
visit, and count the clicks.

## 👥 Who it's for

- **For:** a developer who wants their *own* short links on their *own* domain,
  with click counts, deployed free on the edge.
- **Not for:** teams needing branded campaigns, A/B routing, QR suites, or
  link-level auth/expiry. That's a product; this is a utility.

## 🎯 Goals

1. Create a short link from a long URL via a single API call.
2. Redirect a visitor from `/{slug}` to the original URL.
3. Report how many times a link was visited.

## ✅ Success (observable)

- `POST /links` with a valid URL returns a slug and a working short URL.
- `GET /{slug}` 302-redirects to the original URL.
- `GET /api/links/{slug}/stats` returns an accurate click count.
- Deploys to Cloudflare Workers free tier with D1 as the only datastore.

## 🚧 Scope

**In:** create link, redirect + click capture, stats read. REST/JSON API.

**Out:** custom slugs, auth/accounts, link editing/deletion, expiry, rate
limiting, a UI, analytics beyond a raw count. (All parked — YAGNI for the demo.)

## 🧱 Constraints

- TypeScript on Bun (dev/test); ships as Workers-compatible code (Web APIs).
- SQLite + Drizzle locally → Cloudflare D1 in prod. Free-tier-first.
- REST + Result/typed errors. Strict TS. Tests-first.

## ⚠️ Riskiest unknowns

- Slug collision strategy under concurrency (generate-and-retry vs. counter).
- Whether per-visit click writes stay within D1 free-tier write limits.

## 🔍 Open questions

- Slug length / alphabet? (Assumed: 7-char base62, regenerate on collision.)
- Count clicks in a `clicks` table, or a counter column on `links`? (Assumed:
  separate `clicks` table — keeps the door open for per-click metadata later.)
