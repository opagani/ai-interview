// STORY-2 — Open the interview UI
import { describe, it, expect, beforeAll } from "bun:test";
import {
  BASE,
  FULL_CHAT_SCRIPT,
  PASSING_JUDGE,
  buildApp,
  createSessionRequest,
  postComplete,
  runFullInterview,
} from "./support/build-techscreen-app";

describe("Feature: a candidate opens the interview link", () => {
  describe("Scenario: a valid token serves the chat page", () => {
    let res: Response;

    beforeAll(async () => {
      const { app } = buildApp();
      const { json } = await createSessionRequest(app);
      res = await app.fetch(new Request(`${BASE}/interview/${json.token}`));
    });

    it("responds with 200", () => {
      expect(res.status).toBe(200);
    });

    it("returns an HTML content type", () => {
      expect(res.headers.get("content-type") ?? "").toContain("text/html");
    });
  });

  describe("Scenario: a completed session opens directly to results", () => {
    let res: Response;
    let body: string;

    beforeAll(async () => {
      const { app } = buildApp({
        scriptChat: FULL_CHAT_SCRIPT,
        scriptJudge: PASSING_JUDGE,
      });
      const token = await runFullInterview(app);
      await postComplete(app, token);
      res = await app.fetch(new Request(`${BASE}/interview/${token}`));
      body = await res.text();
    });

    it("responds with 200", () => {
      expect(res.status).toBe(200);
    });

    it("renders the candidate's overall score notes in the page", () => {
      expect(body).toContain(PASSING_JUDGE.overall.notes);
    });
  });

  // -------------------------------------------------------------------
  // SAD PATH
  // -------------------------------------------------------------------

  describe("Scenario: an unknown token responds 404", () => {
    let res: Response;

    beforeAll(async () => {
      const { app } = buildApp();
      res = await app.fetch(new Request(`${BASE}/interview/no-such-token`));
    });

    it("responds with 404", () => {
      expect(res.status).toBe(404);
    });
  });
});
