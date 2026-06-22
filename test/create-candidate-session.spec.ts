// STORY-1 — Create a candidate session
import { describe, it, expect, beforeAll } from "bun:test";
import {
  ADMIN,
  BASE,
  buildApp,
  createSessionRequest,
} from "./support/build-techscreen-app";

describe("Feature: an interviewer creates a candidate session", () => {
  describe("Scenario: admin creates a session with a valid bearer token", () => {
    let res: Response;
    let body: { token: string; url: string };
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp();
      repo = built.repo;
      const out = await createSessionRequest(built.app);
      res = out.res;
      body = out.json;
    });

    it("returns 201", () => {
      expect(res.status).toBe(201);
    });

    it("returns a non-empty token", () => {
      expect(body.token.length).toBeGreaterThan(0);
    });

    it("returns the candidate-facing URL composed from baseUrl + token", () => {
      expect(body.url).toBe(`${BASE}/interview/${body.token}`);
    });

    it("persists the session with status `pending`", async () => {
      const session = await repo.findByToken(body.token);
      expect(session?.status).toBe("pending");
    });
  });

  describe("Scenario: two successive creates produce different tokens", () => {
    let firstToken: string;
    let secondToken: string;

    beforeAll(async () => {
      const { app } = buildApp();
      const a = await createSessionRequest(app);
      const b = await createSessionRequest(app);
      firstToken = a.json.token;
      secondToken = b.json.token;
    });

    it("returns different tokens for two consecutive create calls", () => {
      expect(firstToken).not.toBe(secondToken);
    });
  });

  // -------------------------------------------------------------------
  // SAD PATH
  // -------------------------------------------------------------------

  describe("Scenario: missing Authorization header is rejected", () => {
    let res: Response;
    let body: { error: string };

    beforeAll(async () => {
      const { app } = buildApp();
      res = await app.fetch(
        new Request(`${BASE}/api/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }),
      );
      body = (await res.json()) as { error: string };
    });

    it("responds with 401", () => {
      expect(res.status).toBe(401);
    });

    it("returns the `unauthorized` error code", () => {
      expect(body.error).toBe("unauthorized");
    });
  });

  describe("Scenario: invalid bearer token is rejected", () => {
    let res: Response;
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp();
      repo = built.repo;
      res = await built.app.fetch(
        new Request(`${BASE}/api/sessions`, {
          method: "POST",
          headers: {
            Authorization: "Bearer wrong-secret",
            "Content-Type": "application/json",
          },
          body: "{}",
        }),
      );
    });

    it("responds with 401", () => {
      expect(res.status).toBe(401);
    });

    it("does not persist any session", async () => {
      const all = await repo.listAll();
      expect(all).toHaveLength(0);
    });
  });
});
