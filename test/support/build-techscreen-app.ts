// Test-only construction helpers for TechScreen specs.
// All specs drive the deployed entry point `createApp(deps).fetch`
// with in-memory + scripted fakes injected at the boundary.

import { createApp } from "../../src/app";
import { createFakeSessionRepository } from "../../src/sessions/repository.fake";
import { createFakeLlmClient } from "../../src/llm/client.fake";
import type { Question } from "../../src/sessions/questions";
import type { JudgeResult } from "../../src/llm/client";

export const ADMIN = "test-admin-secret";
export const BASE = "https://techscreen.test";

// Minimal 4-question bank — one per topic — to keep the turn loop tractable.
export const TINY_BANK: Question[] = [
  { id: "ts-1", topic: "typescript", prompt: "Explain `unknown` vs `any`." },
  { id: "react-1", topic: "react", prompt: "When do you reach for useMemo?" },
  { id: "python-1", topic: "python", prompt: "Generators vs lists?" },
  { id: "ai-1", topic: "ai", prompt: "What is RAG?" },
];

// One canned assistant message per call: opening + one per answered question.
export const FULL_CHAT_SCRIPT = [
  "Welcome! Let's start with TypeScript. Explain `unknown` vs `any`.",
  "Good. Now React: when do you reach for useMemo?",
  "OK. Python next: generators vs lists?",
  "Last topic, AI: what is RAG?",
  "Thanks — interview complete.",
];

export const PASSING_JUDGE: JudgeResult = {
  scores: [
    { topic: "typescript", score: 4, notes: "Solid grasp of `unknown` vs `any`." },
    { topic: "react", score: 3, notes: "Mostly right on memoization, missed dep-array nuance." },
    { topic: "python", score: 4, notes: "Clear on generators." },
    { topic: "ai", score: 3, notes: "Adequate RAG description." },
  ],
  overall: { score: 4, notes: "Strong overall with gaps in React perf." },
};

export function buildApp(opts: {
  questions?: Question[];
  scriptChat?: string[];
  scriptJudge?: JudgeResult;
} = {}) {
  const repo = createFakeSessionRepository();
  const llm = createFakeLlmClient();
  if (opts.scriptChat) llm.scriptChat(opts.scriptChat);
  if (opts.scriptJudge) llm.scriptJudge(opts.scriptJudge);
  const app = createApp({
    repo,
    llm,
    questions: opts.questions ?? TINY_BANK,
    adminToken: ADMIN,
    baseUrl: BASE,
  });
  return { app, repo, llm };
}

export async function createSessionRequest(
  app: ReturnType<typeof buildApp>["app"],
  body: object = {},
) {
  const res = await app.fetch(
    new Request(`${BASE}/api/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  return { res, json: (await res.json()) as { token: string; url: string } };
}

export async function postTurn(
  app: ReturnType<typeof buildApp>["app"],
  token: string,
  answer: string | null,
) {
  const res = await app.fetch(
    new Request(`${BASE}/api/sessions/${token}/turns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    }),
  );
  return {
    res,
    json: (await res.json()) as {
      assistant: string;
      isComplete: boolean;
      topic: string;
    },
  };
}

export async function postComplete(
  app: ReturnType<typeof buildApp>["app"],
  token: string,
) {
  const res = await app.fetch(
    new Request(`${BASE}/api/sessions/${token}/complete`, { method: "POST" }),
  );
  return { res, json: (await res.json()) as JudgeResult | { error: string } };
}

export async function getResults(
  app: ReturnType<typeof buildApp>["app"],
  token: string,
) {
  const res = await app.fetch(
    new Request(`${BASE}/api/sessions/${token}/results`),
  );
  return { res, json: (await res.json()) as JudgeResult | { error: string } };
}

// Drives an entire interview to `awaiting_scoring`. Returns the token.
export async function runFullInterview(
  app: ReturnType<typeof buildApp>["app"],
): Promise<string> {
  const { json: created } = await createSessionRequest(app);
  await postTurn(app, created.token, null);
  await postTurn(app, created.token, "A1");
  await postTurn(app, created.token, "A2");
  await postTurn(app, created.token, "A3");
  await postTurn(app, created.token, "A4");
  return created.token;
}
