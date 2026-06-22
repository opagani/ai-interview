// STORY-5 — Read interview results
import { describe, it, expect, beforeAll } from "bun:test";
import {
  FULL_CHAT_SCRIPT,
  PASSING_JUDGE,
  buildApp,
  createSessionRequest,
  getResults,
  postComplete,
  postTurn,
  runFullInterview,
} from "./support/build-techscreen-app";
import type { JudgeResult, ScoreEntry } from "../src/llm/client";

describe("Feature: reading the results of a completed interview", () => {
  describe("Scenario: a completed session returns its persisted scores", () => {
    let res: Response;
    let body: JudgeResult;

    beforeAll(async () => {
      const { app } = buildApp({
        scriptChat: FULL_CHAT_SCRIPT,
        scriptJudge: PASSING_JUDGE,
      });
      const token = await runFullInterview(app);
      await postComplete(app, token);
      const out = await getResults(app, token);
      res = out.res;
      body = out.json as JudgeResult;
    });

    it("responds with 200", () => {
      expect(res.status).toBe(200);
    });

    it("returns the four per-topic scores", () => {
      expect(body.scores).toHaveLength(4);
    });

    it("returns the overall score block", () => {
      expect(body.overall).toBeDefined();
    });

    it("includes a score for every required topic", () => {
      const topics = body.scores.map((s: ScoreEntry) => s.topic).sort();
      expect(topics).toEqual(["ai", "python", "react", "typescript"]);
    });
  });

  // -------------------------------------------------------------------
  // SAD PATH
  // -------------------------------------------------------------------

  describe("Scenario: an unknown token responds 404", () => {
    let res: Response;
    let body: { error: string };

    beforeAll(async () => {
      const { app } = buildApp();
      const out = await getResults(app, "no-such-token");
      res = out.res;
      body = out.json as { error: string };
    });

    it("responds with 404", () => {
      expect(res.status).toBe(404);
    });

    it("returns the `not_found` error code", () => {
      expect(body.error).toBe("not_found");
    });
  });

  describe("Scenario: a pending session reports `results_not_ready`", () => {
    let res: Response;
    let body: { error: string };

    beforeAll(async () => {
      const { app } = buildApp();
      const created = await createSessionRequest(app);
      const out = await getResults(app, created.json.token);
      res = out.res;
      body = out.json as { error: string };
    });

    it("responds with 409", () => {
      expect(res.status).toBe(409);
    });

    it("returns the `results_not_ready` error code", () => {
      expect(body.error).toBe("results_not_ready");
    });
  });

  describe("Scenario: an awaiting-scoring session reports `results_not_ready`", () => {
    let res: Response;

    beforeAll(async () => {
      const { app } = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      const created = await createSessionRequest(app);
      await postTurn(app, created.json.token, null);
      await postTurn(app, created.json.token, "A1");
      await postTurn(app, created.json.token, "A2");
      await postTurn(app, created.json.token, "A3");
      await postTurn(app, created.json.token, "A4");
      const out = await getResults(app, created.json.token);
      res = out.res;
    });

    it("responds with 409", () => {
      expect(res.status).toBe(409);
    });
  });
});
