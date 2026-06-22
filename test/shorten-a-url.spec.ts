// STORY-1 — Shorten a URL
import { describe, it, expect, beforeAll } from "bun:test";

import { createApp } from "../src/app";
import { fakeLinkRepository, type FakeLinkRepository } from "./support/fake-link-repository";
import type { Link } from "../src/links/repository";

const BASE_URL = "https://sho.rt";

describe("Feature: shorten a URL", () => {
  // -------------------------------------------------------------------------
  // HAPPY PATH
  // -------------------------------------------------------------------------

  describe("Scenario: shortening a valid URL", () => {
    const target = "https://example.com/some/long/path";
    let status: number;
    let body: { slug: string; shortUrl: string; targetUrl: string };
    let persisted: Link | null;

    beforeAll(async () => {
      const repo: FakeLinkRepository = fakeLinkRepository();
      const app = createApp({ repo, slug: () => "abc1234", baseUrl: BASE_URL });
      const res = await app.fetch(
        new Request(`${BASE_URL}/links`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: target }),
        }),
      );
      status = res.status;
      body = (await res.json()) as typeof body;
      persisted = await repo.findBySlug("abc1234");
    });

    it("responds 201", () => {
      expect(status).toBe(201);
    });

    it("returns the generated slug", () => {
      expect(body.slug).toBe("abc1234");
    });

    it("returns the short URL", () => {
      expect(body.shortUrl).toBe(`${BASE_URL}/abc1234`);
    });

    it("echoes the target URL", () => {
      expect(body.targetUrl).toBe(target);
    });

    it("persists the link", () => {
      expect(persisted?.targetUrl).toBe(target);
    });
  });

  // -------------------------------------------------------------------------
  // SAD PATH — segregated
  // -------------------------------------------------------------------------

  describe("Scenario: rejecting a malformed URL", () => {
    let status: number;
    let body: { error: string };

    beforeAll(async () => {
      const app = createApp({ repo: fakeLinkRepository(), slug: () => "abc1234", baseUrl: BASE_URL });
      const res = await app.fetch(
        new Request(`${BASE_URL}/links`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: "not-a-url" }),
        }),
      );
      status = res.status;
      body = (await res.json()) as typeof body;
    });

    it("responds 400", () => {
      expect(status).toBe(400);
    });

    it("returns the invalid_url error", () => {
      expect(body.error).toBe("invalid_url");
    });
  });

  describe("Scenario: rejecting a missing url field", () => {
    let status: number;

    beforeAll(async () => {
      const app = createApp({ repo: fakeLinkRepository(), slug: () => "abc1234", baseUrl: BASE_URL });
      const res = await app.fetch(
        new Request(`${BASE_URL}/links`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        }),
      );
      status = res.status;
    });

    it("responds 400", () => {
      expect(status).toBe(400);
    });
  });
});
