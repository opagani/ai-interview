<!-- Owner: /design — do not edit from other phase commands. -->

# 📋 Spec — ShortLink (DEMO)

> 🧪 Demo behavioral spec. Testable, observable behavior only. `/plan` slices
> this into stories; `bdd-specs` turns it into executable specs.

## ✨ Features & behavior

### F1 — Shorten a URL  ·  `POST /links`

Request body: `{ "url": string }`.

- Given a valid absolute `http(s)` URL, the system creates a link with a unique
  slug and responds **201** with `{ slug, shortUrl, targetUrl }` where
  `shortUrl = {baseUrl}/{slug}` and `targetUrl` echoes the input.
- The created link is retrievable by its slug afterward (persisted).
- Given a missing or malformed/non-`http(s)` `url`, responds **400** with
  `{ error: "invalid_url" }`; nothing is persisted.
- If a generated slug already exists, the system retries with a new slug; the
  visible outcome is still a 201 with a unique slug.

### F2 — Redirect to target  ·  `GET /{slug}`

- Given an existing slug, responds **302** with `Location: {targetUrl}`.
- Each successful redirect records exactly one click for that link.
- Given an unknown slug, responds **404**; no click is recorded.

### F3 — View link stats  ·  `GET /api/links/{slug}/stats`

- Given an existing slug, responds **200** with `{ slug, targetUrl, clicks }`
  where `clicks` is the exact number of redirects served for that link.
- A link that was never visited reports `clicks: 0`.
- Given an unknown slug, responds **404**.

## 🔢 Invariants

- `slug` is unique across all links.
- `clicks` for a link equals the number of successful `GET /{slug}` redirects.
- Expected failures return a JSON `{ error }` body with a typed code
  (`invalid_url` | `not_found`), never a thrown 500.

## 🔌 Entry point

All behavior is observable through the deployed `fetch` handler
(`createApp(deps).fetch`). Specs MUST drive this handler with a fake
repository injected at the boundary — not the internal service functions alone.
