// STORY-3 — View link stats
import { describe, it, expect, beforeAll } from "bun:test";

import { createApp } from "../src/app";
import { fakeLinkRepository } from "./support/fake-link-repository";

const BASE_URL = "https://sho.rt";

describe("Feature: view link stats", () => {
  // -------------------------------------------------------------------------
  // HAPPY PATH
  // -------------------------------------------------------------------------

  describe("Scenario: viewing stats for a visited link", () => {
    const target = "https://example.com/some/long/path";
    let status: number;
    let body: { slug: string; targetUrl: string; clicks: number };

    beforeAll(async () => {
      const repo = fakeLinkRepository();
      const link = repo.seedLink({ slug: "abc1234", targetUrl: target, createdAt: new Date(0) });
      await repo.recordClick(link.id);
      await repo.recordClick(link.id);
      await repo.recordClick(link.id);
      const app = createApp({ repo, slug: () => "unused", baseUrl: BASE_URL });
      const res = await app.fetch(new Request(`${BASE_URL}/api/links/abc1234/stats`));
      status = res.status;
      body = (await res.json()) as typeof body;
    });

    it("responds 200", () => {
      expect(status).toBe(200);
    });

    it("returns the slug", () => {
      expect(body.slug).toBe("abc1234");
    });

    it("returns the target URL", () => {
      expect(body.targetUrl).toBe(target);
    });

    it("returns the exact click count", () => {
      expect(body.clicks).toBe(3);
    });
  });

  describe("Scenario: viewing stats for a never-visited link", () => {
    let body: { clicks: number };

    beforeAll(async () => {
      const repo = fakeLinkRepository();
      repo.seedLink({ slug: "fresh99", targetUrl: "https://example.com/x", createdAt: new Date(0) });
      const app = createApp({ repo, slug: () => "unused", baseUrl: BASE_URL });
      const res = await app.fetch(new Request(`${BASE_URL}/api/links/fresh99/stats`));
      body = (await res.json()) as typeof body;
    });

    it("reports zero clicks", () => {
      expect(body.clicks).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // SAD PATH — segregated
  // -------------------------------------------------------------------------

  describe("Scenario: stats for an unknown slug", () => {
    let status: number;

    beforeAll(async () => {
      const repo = fakeLinkRepository();
      const app = createApp({ repo, slug: () => "unused", baseUrl: BASE_URL });
      const res = await app.fetch(new Request(`${BASE_URL}/api/links/missing/stats`));
      status = res.status;
    });

    it("responds 404", () => {
      expect(status).toBe(404);
    });
  });
});
