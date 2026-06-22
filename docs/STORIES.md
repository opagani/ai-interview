<!-- Owner: /plan — do not edit from other phase commands. -->

# 📚 User Stories — ShortLink (DEMO)

> 🧪 Demo backlog. Each story → one Feature; each Given/When/Then → a Scenario.

---

## STORY-1 — Shorten a URL

**As a** developer
**I want** to turn a long URL into a short slug via the API
**So that** I can share a compact link on my own domain

### Acceptance criteria

- Given a valid URL `https://example.com/some/long/path`, when I `POST /links`
  with it, then the response status is 201.
- Given that request, then the response body has a non-empty `slug`.
- Given that request, then the response body's `shortUrl` is `{baseUrl}/{slug}`.
- Given that request, then the response body's `targetUrl` equals the URL I sent.
- Given that request succeeded, then the link is retrievable by its slug.

#### Sad path
- Given a malformed URL `"not-a-url"`, when I `POST /links`, then the status is
  400 and the body is `{ error: "invalid_url" }`.
- Given a body with no `url` field, when I `POST /links`, then the status is 400.

---

## STORY-2 — Redirect to the target URL

**As a** visitor
**I want** visiting a short link to send me to the original URL
**So that** the short link actually works

### Acceptance criteria

- Given an existing slug, when I `GET /{slug}`, then the status is 302.
- Given that request, then the `Location` header equals the link's target URL.
- Given that redirect was served, then the link's recorded click count is 1.

#### Sad path
- Given an unknown slug, when I `GET /{slug}`, then the status is 404.
- Given an unknown slug, then no click is recorded.

---

## STORY-3 — View link stats

**As a** developer
**I want** to read how many times a link was visited
**So that** I know if anyone is using it

### Acceptance criteria

- Given a link visited 3 times, when I `GET /api/links/{slug}/stats`, then the
  status is 200.
- Given that request, then the body's `slug` equals the link's slug.
- Given that request, then the body's `targetUrl` equals the link's target URL.
- Given that request, then the body's `clicks` equals 3.
- Given a link never visited, when I read its stats, then `clicks` equals 0.

#### Sad path
- Given an unknown slug, when I `GET /api/links/{slug}/stats`, then the status
  is 404.
