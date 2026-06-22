// STORY-2 — Redirect to the target URL
import { describe, it, expect, beforeAll } from "bun:test";

import { createApp } from "../src/app";
import { fakeLinkRepository, type FakeLinkRepository } from "./support/fake-link-repository";

const BASE_URL = "https://sho.rt";

describe("Feature: redirect to the target URL", () => {
  // -------------------------------------------------------------------------
  // HAPPY PATH
  // -------------------------------------------------------------------------

  describe("Scenario: following an existing short link", () => {
    const target = "https://example.com/some/long/path";
    let repo: FakeLinkRepository;
    let linkId: number;
    let res: Response;

    beforeAll(async () => {
      repo = fakeLinkRepository();
      const link = repo.seedLink({ slug: "abc1234", targetUrl: target, createdAt: new Date(0) });
      linkId = link.id;
      const app = createApp({ repo, slug: () => "unused", baseUrl: BASE_URL });
      res = await app.fetch(new Request(`${BASE_URL}/abc1234`, { redirect: "manual" }));
    });

    it("responds 302", () => {
      expect(res.status).toBe(302);
    });

    it("sets Location to the target URL", () => {
      expect(res.headers.get("location")).toBe(target);
    });

    it("records exactly one click", () => {
      expect(repo.clickCountFor(linkId)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // SAD PATH — segregated
  // -------------------------------------------------------------------------

  describe("Scenario: following an unknown slug", () => {
    let repo: FakeLinkRepository;
    let status: number;

    beforeAll(async () => {
      repo = fakeLinkRepository();
      const app = createApp({ repo, slug: () => "unused", baseUrl: BASE_URL });
      const res = await app.fetch(new Request(`${BASE_URL}/missing`, { redirect: "manual" }));
      status = res.status;
    });

    it("responds 404", () => {
      expect(status).toBe(404);
    });

    it("records no clicks", () => {
      expect(repo.clickCountFor(1)).toBe(0);
    });
  });
});
