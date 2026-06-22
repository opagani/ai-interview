// Test-only scripted implementation of the LlmClient port.
// Not imported by production code — only used in test/support.

import type { ChatMessage, JudgeResult, LlmClient } from "./client";

const DEFAULT_CHAT_RESPONSE = "Thank you for your answer.";

const DEFAULT_JUDGE_RESULT: JudgeResult = {
  scores: [
    { topic: "typescript", score: 3, notes: "Default scripted score." },
    { topic: "react", score: 3, notes: "Default scripted score." },
    { topic: "python", score: 3, notes: "Default scripted score." },
    { topic: "ai", score: 3, notes: "Default scripted score." },
  ],
  overall: { score: 3, notes: "Default scripted overall." },
};

export type FakeLlmClient = LlmClient & {
  scriptChat(responses: string[]): void;
  scriptJudge(result: JudgeResult): void;
  failNextChat(): void;
  failNextJudge(): void;
  judgeCallCount(): number;
};

export function createFakeLlmClient(): FakeLlmClient {
  // FIFO queue of scripted chat responses
  let chatQueue: string[] = [];
  // Scripted judge result (replaced each time scriptJudge is called)
  let judgeResult: JudgeResult | undefined = undefined;
  // Number of pending chat failures to throw
  let chatFailuresQueued = 0;
  // Number of pending judge failures to throw
  let judgeFailuresQueued = 0;
  // Total judge() invocations (including failed ones)
  let judgeCount = 0;

  async function chat(_messages: ChatMessage[]): Promise<string> {
    if (chatFailuresQueued > 0) {
      chatFailuresQueued -= 1;
      throw new Error("Scripted LLM chat failure.");
    }
    const next = chatQueue.shift();
    return next ?? DEFAULT_CHAT_RESPONSE;
  }

  async function judge(_transcript: ChatMessage[]): Promise<JudgeResult> {
    judgeCount += 1;
    if (judgeFailuresQueued > 0) {
      judgeFailuresQueued -= 1;
      throw new Error("Scripted LLM judge failure.");
    }
    return judgeResult ?? DEFAULT_JUDGE_RESULT;
  }

  function scriptChat(responses: string[]): void {
    chatQueue = [...responses];
  }

  function scriptJudge(result: JudgeResult): void {
    judgeResult = result;
  }

  function failNextChat(): void {
    chatFailuresQueued += 1;
  }

  function failNextJudge(): void {
    judgeFailuresQueued += 1;
  }

  function judgeCallCount(): number {
    return judgeCount;
  }

  return { chat, judge, scriptChat, scriptJudge, failNextChat, failNextJudge, judgeCallCount };
}
