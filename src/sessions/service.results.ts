// Service: retrieve scored results for a completed session.
// Expected failures are returned as Result values — no throwing.

import type { SessionRepository, ScoreRow } from "./repository";
import type { JudgeResult, ScoreEntry } from "../llm/client";
import type { Result } from "../shared/result";
import { ok, err } from "../shared/result";

export type GetResultsDeps = { repo: SessionRepository };
export type GetResultsInput = { token: string };
export type GetResultsError = "not_found" | "results_not_ready";

function rowToEntry(row: ScoreRow): ScoreEntry {
  return { topic: row.topic, score: row.score, notes: row.notes };
}

export async function getResults(
  deps: GetResultsDeps,
  input: GetResultsInput,
): Promise<Result<JudgeResult, GetResultsError>> {
  const session = await deps.repo.findByToken(input.token);
  if (session === null) {
    return err("not_found");
  }

  if (session.status !== "complete") {
    return err("results_not_ready");
  }

  const rows = await deps.repo.listScores(input.token);

  const overallRow = rows.find((r) => r.topic === "overall");
  const topicRows = rows.filter((r) => r.topic !== "overall");

  const topicScores: ScoreEntry[] = topicRows.map(rowToEntry);

  // overall row omits the topic field per ScoreEntry shape (topic is optional)
  const overall: ScoreEntry = overallRow !== undefined
    ? { score: overallRow.score, notes: overallRow.notes }
    : { score: 0, notes: "" };

  return ok({ scores: topicScores, overall });
}
