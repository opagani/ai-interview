// Service: submit a candidate turn and get the next interviewer response.
// Expected failures are returned as Result values — no throwing.

import type { SessionRepository } from "./repository";
import type { LlmClient, ChatMessage } from "../llm/client";
import type { Question } from "./questions";
import type { Result } from "../shared/result";
import { ok, err } from "../shared/result";
import { buildInterviewerSystemPrompt } from "./prompts";

export type SubmitAnswerDeps = {
  repo: SessionRepository;
  llm: LlmClient;
  questions: Question[];
};

export type SubmitAnswerInput = {
  token: string;
  answer: string | null;
};

export type SubmitAnswerOutput = {
  assistant: string;
  isComplete: boolean;
  topic: string;
};

export type SubmitAnswerError = "not_found" | "session_closed" | "llm_failed";

export async function submitAnswer(
  deps: SubmitAnswerDeps,
  input: SubmitAnswerInput,
): Promise<Result<SubmitAnswerOutput, SubmitAnswerError>> {
  const { repo, llm, questions } = deps;
  const { token, answer } = input;

  // 1. Load session.
  const session = await repo.findByToken(token);
  if (session === null) {
    return err("not_found");
  }

  // 2. Reject closed sessions.
  if (session.status === "complete" || session.status === "awaiting_scoring") {
    return err("session_closed");
  }

  // 3. Flip pending → active on first contact.
  if (session.status === "pending") {
    await repo.updateStatus(token, "active", { startedAt: new Date() });
  }

  // 4. Determine current question.
  const currentQuestion = questions[session.currentQuestionIndex];
  if (currentQuestion === undefined) {
    return err("session_closed");
  }

  // 5. Append the user turn when there is a non-empty answer.
  const hasAnswer = answer !== null && answer.trim().length > 0;
  let appendedUserTurnId: number | null = null;

  if (hasAnswer) {
    const userTurn = await repo.appendTurn(session.id, {
      role: "user",
      content: answer as string,
      topic: currentQuestion.topic,
      questionId: currentQuestion.id,
    });
    appendedUserTurnId = userTurn.id;
  }

  // 6. Build full message history for the LLM.
  const turns = await repo.listTurns(token);
  const history: ChatMessage[] = turns
    .filter((t) => t.role === "user" || t.role === "assistant")
    .map((t) => ({ role: t.role as "user" | "assistant", content: t.content }));

  const messages: ChatMessage[] = [
    { role: "system", content: buildInterviewerSystemPrompt(currentQuestion) },
    ...history,
  ];

  // 7. Call LLM — rollback user turn on failure.
  let assistantText: string;
  try {
    assistantText = await llm.chat(messages);
  } catch {
    if (appendedUserTurnId !== null) {
      // deleteTurnsAfter removes everything with id > afterId, so pass id - 1.
      await repo.deleteTurnsAfter(session.id, appendedUserTurnId - 1);
    }
    return err("llm_failed");
  }

  // 8. Persist the assistant turn.
  await repo.appendTurn(session.id, {
    role: "assistant",
    content: assistantText,
    topic: currentQuestion.topic,
    questionId: currentQuestion.id,
  });

  // 9. Determine completion — only advance after a real answer, not the opening null turn.
  const nextIndex = hasAnswer
    ? session.currentQuestionIndex + 1
    : session.currentQuestionIndex;
  const isComplete = hasAnswer && nextIndex >= questions.length;

  // 10 & 11. Advance state.
  if (isComplete) {
    await repo.updateStatus(token, "awaiting_scoring", {
      currentQuestionIndex: nextIndex,
    });
  } else {
    await repo.updateStatus(token, "active", {
      currentQuestionIndex: nextIndex,
    });
  }

  // 12. Return result.
  return ok({
    assistant: assistantText,
    isComplete,
    topic: currentQuestion.topic,
  });
}
