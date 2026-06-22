// STORY-4 — Complete and score the interview
import { describe, it, expect, beforeAll } from "bun:test";
import {
  FULL_CHAT_SCRIPT,
  PASSING_JUDGE,
  buildApp,
  createSessionRequest,
  postComplete,
  postTurn,
  runFullInterview,
} from "./support/build-techscreen-app";
import type { JudgeResult, ScoreEntry } from "../src/llm/client";

describe("Feature: the system scores a completed interview against the rubric", () => {
  describe("Scenario: a completed interview is graded across all topics", () => {
    let res: Response;
    let body: JudgeResult;
    let token: string;
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp({
        scriptChat: FULL_CHAT_SCRIPT,
        scriptJudge: PASSING_JUDGE,
      });
      repo = built.repo;
      token = await runFullInterview(built.app);
      const out = await postComplete(built.app, token);
      res = out.res;
      body = out.json as JudgeResult;
    });

    it("responds with 200", () => {
      expect(res.status).toBe(200);
    });

    it("returns exactly four per-topic scores", () => {
      expect(body.scores).toHaveLength(4);
    });

    it("includes a score for every required topic", () => {
      const topics = body.scores.map((s: ScoreEntry) => s.topic).sort();
      expect(topics).toEqual(["ai", "python", "react", "typescript"]);
    });

    it("returns an overall score in the 1–5 range", () => {
      expect(body.overall.score).toBeGreaterThanOrEqual(1);
      expect(body.overall.score).toBeLessThanOrEqual(5);
    });

    it("emits per-topic scores all within 1–5", () => {
      const inRange = body.scores.every(
        (s: ScoreEntry) => Number.isInteger(s.score) && s.score >= 1 && s.score <= 5,
      );
      expect(inRange).toBe(true);
    });

    it("attaches non-empty notes to every per-topic score", () => {
      const allNoted = body.scores.every((s: ScoreEntry) => s.notes.length > 0);
      expect(allNoted).toBe(true);
    });

    it("attaches non-empty notes to the overall score", () => {
      expect(body.overall.notes.length).toBeGreaterThan(0);
    });

    it("persists exactly five score rows (four topics plus overall)", async () => {
      const persisted = await repo.listScores(token);
      expect(persisted).toHaveLength(5);
    });

    it("flips the session status to `complete`", async () => {
      const session = await repo.findByToken(token);
      expect(session?.status).toBe("complete");
    });

    it("stamps `completed_at`", async () => {
      const session = await repo.findByToken(token);
      expect(session?.completedAt).toBeTruthy();
    });
  });

  describe("Scenario: completing an already-complete session is idempotent", () => {
    let firstBody: JudgeResult;
    let secondBody: JudgeResult;
    let judgeCallCount: number;

    beforeAll(async () => {
      const built = buildApp({
        scriptChat: FULL_CHAT_SCRIPT,
        scriptJudge: PASSING_JUDGE,
      });
      const token = await runFullInterview(built.app);
      const first = await postComplete(built.app, token);
      firstBody = first.json as JudgeResult;
      const second = await postComplete(built.app, token);
      secondBody = second.json as JudgeResult;
      judgeCallCount = built.llm.judgeCallCount();
    });

    it("returns the same overall score on the second call", () => {
      expect(secondBody.overall.score).toBe(firstBody.overall.score);
    });

    it("does not invoke the judge a second time", () => {
      expect(judgeCallCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------
  // SAD PATH
  // -------------------------------------------------------------------

  describe("Scenario: a pending session cannot be completed", () => {
    let res: Response;
    let body: { error: string };

    beforeAll(async () => {
      const { app } = buildApp();
      const created = await createSessionRequest(app);
      const out = await postComplete(app, created.json.token);
      res = out.res;
      body = out.json as { error: string };
    });

    it("responds with 409", () => {
      expect(res.status).toBe(409);
    });

    it("returns the `interview_in_progress` error code", () => {
      expect(body.error).toBe("interview_in_progress");
    });
  });

  describe("Scenario: an active (not finished) session cannot be completed", () => {
    let res: Response;

    beforeAll(async () => {
      const { app } = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      const created = await createSessionRequest(app);
      await postTurn(app, created.json.token, null);
      await postTurn(app, created.json.token, "A1");
      const out = await postComplete(app, created.json.token);
      res = out.res;
    });

    it("responds with 409", () => {
      expect(res.status).toBe(409);
    });
  });

  describe("Scenario: a persistent judge failure surfaces as 502", () => {
    let res: Response;
    let body: { error: string };
    let token: string;
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      repo = built.repo;
      token = await runFullInterview(built.app);
      built.llm.failNextJudge();
      built.llm.failNextJudge(); // fail both the first call and the retry
      const out = await postComplete(built.app, token);
      res = out.res;
      body = out.json as { error: string };
    });

    it("responds with 502", () => {
      expect(res.status).toBe(502);
    });

    it("returns the `judge_failed` error code", () => {
      expect(body.error).toBe("judge_failed");
    });

    it("leaves the session in `awaiting_scoring` so it can be retried", async () => {
      const session = await repo.findByToken(token);
      expect(session?.status).toBe("awaiting_scoring");
    });
  });
});
