// Service: complete a session and score it via the LLM judge.
// Expected failures are returned as Result values — no throwing.

import type { SessionRepository, ScoreRow } from "./repository";
import type { LlmClient, JudgeResult, ChatMessage, ScoreEntry } from "../llm/client";
import type { Result } from "../shared/result";
import { ok, err } from "../shared/result";
import { buildJudgeMessages } from "./prompts";

export type CompleteAndScoreDeps = {
  repo: SessionRepository;
  llm: LlmClient;
};

export type CompleteAndScoreInput = {
  token: string;
};

export type CompleteAndScoreError = "not_found" | "interview_in_progress" | "judge_failed";

/**
 * Reconstructs a JudgeResult from persisted ScoreRow records.
 * The overall score is stored with topic === "overall".
 */
function reconstructJudgeResult(rows: ScoreRow[]): JudgeResult {
  const topicRows = rows.filter((r) => r.topic !== "overall");
  const overallRow = rows.find((r) => r.topic === "overall");

  const scores: ScoreEntry[] = topicRows.map((r) => ({
    topic: r.topic,
    score: r.score,
    notes: r.notes,
  }));

  const overall: ScoreEntry = overallRow !== undefined
    ? { score: overallRow.score, notes: overallRow.notes }
    : { score: 0, notes: "" };

  return { scores, overall };
}

/**
 * Attempts to call the judge once, returning null on failure.
 */
async function tryJudge(
  llm: LlmClient,
  messages: ChatMessage[],
): Promise<JudgeResult | null> {
  try {
    return await llm.judge(messages);
  } catch {
    return null;
  }
}

export async function completeAndScore(
  deps: CompleteAndScoreDeps,
  input: CompleteAndScoreInput,
): Promise<Result<JudgeResult, CompleteAndScoreError>> {
  const { repo, llm } = deps;
  const { token } = input;

  // Step 1: Load session by token.
  const session = await repo.findByToken(token);
  if (session === null) {
    return err("not_found");
  }

  // Step 2: Guard against sessions that haven't finished yet.
  if (session.status === "pending" || session.status === "active") {
    return err("interview_in_progress");
  }

  // Step 3: Idempotent path — session is already complete.
  if (session.status === "complete") {
    const rows = await repo.listScores(token);
    const judgeResult = reconstructJudgeResult(rows);
    return ok(judgeResult);
  }

  // Step 4: Load all turns (status is awaiting_scoring).
  const turns = await repo.listTurns(token);

  // Step 5: Build judge messages — explicit projection keeps the type boundary checked.
  const messages = buildJudgeMessages(
    turns.map((t) => ({ role: t.role, content: t.content })),
  );

  // Step 6: Call judge with one retry on failure.
  let judgeResult = await tryJudge(llm, messages);
  if (judgeResult === null) {
    judgeResult = await tryJudge(llm, messages);
  }
  if (judgeResult === null) {
    return err("judge_failed");
  }

  // Step 7: Persist all 5 scores (4 topic scores + overall).
  const scoreRows: ReadonlyArray<{ topic: string; score: number; notes: string }> = [
    ...judgeResult.scores.map((s) => ({
      topic: s.topic ?? "unknown",
      score: s.score,
      notes: s.notes,
    })),
    {
      topic: "overall",
      score: judgeResult.overall.score,
      notes: judgeResult.overall.notes,
    },
  ];
  await repo.insertScores(session.id, scoreRows);

  // Step 8: Mark session complete.
  await repo.updateStatus(token, "complete", { completedAt: new Date() });

  // Step 9: Return result.
  return ok(judgeResult);
}
