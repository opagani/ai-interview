// STORY-3 — Submit a turn
import { describe, it, expect, beforeAll } from "bun:test";
import {
  BASE,
  FULL_CHAT_SCRIPT,
  PASSING_JUDGE,
  buildApp,
  createSessionRequest,
  postComplete,
  postTurn,
  runFullInterview,
} from "./support/build-techscreen-app";

describe("Feature: a candidate submits a turn in the interview", () => {
  describe("Scenario: opening turn fetches the first question", () => {
    let res: Response;
    let body: { assistant: string; isComplete: boolean; topic: string };
    let token: string;
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      repo = built.repo;
      const created = await createSessionRequest(built.app);
      token = created.json.token;
      const out = await postTurn(built.app, token, null);
      res = out.res;
      body = out.json;
    });

    it("responds with 200", () => {
      expect(res.status).toBe(200);
    });

    it("returns a non-empty assistant message", () => {
      expect(body.assistant.length).toBeGreaterThan(0);
    });

    it("reports `isComplete` false mid-interview", () => {
      expect(body.isComplete).toBe(false);
    });

    it("reports the current topic as the first bank topic (`typescript`)", () => {
      expect(body.topic).toBe("typescript");
    });

    it("flips the session status from `pending` to `active`", async () => {
      const session = await repo.findByToken(token);
      expect(session?.status).toBe("active");
    });
  });

  describe("Scenario: submitting an answer persists both the user and assistant turn", () => {
    let token: string;
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      repo = built.repo;
      const created = await createSessionRequest(built.app);
      token = created.json.token;
      await postTurn(built.app, token, null);
      await postTurn(built.app, token, "my answer text");
    });

    it("appends a user turn with the submitted answer", async () => {
      const turns = await repo.listTurns(token);
      const userTurns = turns.filter((t) => t.role === "user");
      expect(userTurns[userTurns.length - 1]?.content).toBe("my answer text");
    });

    it("appends an assistant turn after the user turn", async () => {
      const turns = await repo.listTurns(token);
      const last = turns[turns.length - 1];
      expect(last?.role).toBe("assistant");
    });
  });

  describe("Scenario: the final answer completes the interview", () => {
    let finalBody: { assistant: string; isComplete: boolean; topic: string };
    let token: string;
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      repo = built.repo;
      const created = await createSessionRequest(built.app);
      token = created.json.token;
      await postTurn(built.app, token, null);
      await postTurn(built.app, token, "A1");
      await postTurn(built.app, token, "A2");
      await postTurn(built.app, token, "A3");
      const out = await postTurn(built.app, token, "A4");
      finalBody = out.json;
    });

    it("reports `isComplete` true on the final turn", () => {
      expect(finalBody.isComplete).toBe(true);
    });

    it("flips the session status to `awaiting_scoring`", async () => {
      const session = await repo.findByToken(token);
      expect(session?.status).toBe("awaiting_scoring");
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
      const out = await postTurn(app, "no-such-token", null);
      res = out.res;
      body = out.json as unknown as { error: string };
    });

    it("responds with 404", () => {
      expect(res.status).toBe(404);
    });

    it("returns the `not_found` error code", () => {
      expect(body.error).toBe("not_found");
    });
  });

  describe("Scenario: a completed session refuses further turns", () => {
    let res: Response;
    let body: { error: string };

    beforeAll(async () => {
      const { app } = buildApp({
        scriptChat: FULL_CHAT_SCRIPT,
        scriptJudge: PASSING_JUDGE,
      });
      const token = await runFullInterview(app);
      await postComplete(app, token);
      const out = await postTurn(app, token, "late answer");
      res = out.res;
      body = out.json as unknown as { error: string };
    });

    it("responds with 409", () => {
      expect(res.status).toBe(409);
    });

    it("returns the `session_closed` error code", () => {
      expect(body.error).toBe("session_closed");
    });
  });

  describe("Scenario: an awaiting-scoring session refuses further turns", () => {
    let res: Response;

    beforeAll(async () => {
      const { app } = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      const token = await runFullInterview(app);
      const out = await postTurn(app, token, "late answer");
      res = out.res;
    });

    it("responds with 409", () => {
      expect(res.status).toBe(409);
    });
  });

  describe("Scenario: an LLM failure is reported as 502 without persisting turns", () => {
    let res: Response;
    let body: { error: string };
    let turnCountBefore: number;
    let turnCountAfter: number;
    let token: string;
    let repo: ReturnType<typeof buildApp>["repo"];

    beforeAll(async () => {
      const built = buildApp({ scriptChat: FULL_CHAT_SCRIPT });
      repo = built.repo;
      const created = await createSessionRequest(built.app);
      token = created.json.token;
      await postTurn(built.app, token, null);
      turnCountBefore = (await repo.listTurns(token)).length;
      built.llm.failNextChat();
      const out = await postTurn(built.app, token, "answer that triggers failure");
      res = out.res;
      body = out.json as unknown as { error: string };
      turnCountAfter = (await repo.listTurns(token)).length;
    });

    it("responds with 502", () => {
      expect(res.status).toBe(502);
    });

    it("returns the `llm_failed` error code", () => {
      expect(body.error).toBe("llm_failed");
    });

    it("does not persist any new turn from the failed attempt", () => {
      expect(turnCountAfter).toBe(turnCountBefore);
    });
  });
});
