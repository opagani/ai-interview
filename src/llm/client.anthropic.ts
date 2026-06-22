// Production Anthropic SDK implementation of the LlmClient port.
// Workers-compatible: uses only Web-standard APIs. No Node.js-only imports.

import Anthropic from "@anthropic-ai/sdk";
import type { LlmClient, ChatMessage, JudgeResult, ScoreEntry } from "./client";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Split a ChatMessage[] into the optional system string and the
 * user/assistant turns that the Anthropic SDK expects.
 */
function splitMessages(messages: ChatMessage[]): {
  system: string | undefined;
  conversation: Anthropic.MessageParam[];
} {
  let system: string | undefined;
  const conversation: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // The SDK accepts a single system string; concatenate in the unlikely
      // event there are multiple system messages.
      system = system === undefined ? msg.content : `${system}\n${msg.content}`;
    } else {
      conversation.push({ role: msg.role, content: msg.content });
    }
  }

  return { system, conversation };
}

/**
 * Extract plain text from the first text content block.
 * Throws if no text block is present.
 */
function extractText(content: Anthropic.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === "text") {
      return block.text;
    }
  }
  throw new Error("AnthropicLlmClient: no text block in response");
}

// ── JudgeResult validation ────────────────────────────────────────────────────

const EXPECTED_TOPICS = ["typescript", "react", "python", "ai"] as const;

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v["topic"] === undefined || typeof v["topic"] === "string") &&
    typeof v["score"] === "number" &&
    Number.isInteger(v["score"]) &&
    v["score"] >= 1 &&
    v["score"] <= 5 &&
    typeof v["notes"] === "string" &&
    v["notes"].length > 0
  );
}

function isJudgeResult(value: unknown): value is JudgeResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (!Array.isArray(v["scores"]) || v["scores"].length !== 4) return false;

  const scores = v["scores"] as unknown[];
  for (let i = 0; i < EXPECTED_TOPICS.length; i++) {
    const entry = scores[i];
    if (!isScoreEntry(entry)) return false;
    // Each scores entry must have a topic matching the expected order.
    const typed = entry as ScoreEntry;
    if (typed.topic !== EXPECTED_TOPICS[i]) return false;
  }

  if (!isScoreEntry(v["overall"])) return false;
  // The overall entry must NOT have a topic key.
  const overall = v["overall"] as ScoreEntry;
  if ("topic" in overall && overall.topic !== undefined) return false;

  return true;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAnthropicLlmClient(apiKey: string): LlmClient {
  const client = new Anthropic({ apiKey });

  async function chat(messages: ChatMessage[]): Promise<string> {
    const { system, conversation } = splitMessages(messages);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      ...(system !== undefined ? { system } : {}),
      messages: conversation,
    });

    return extractText(response.content);
  }

  async function judge(transcript: ChatMessage[]): Promise<JudgeResult> {
    const { system, conversation } = splitMessages(transcript);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      ...(system !== undefined ? { system } : {}),
      messages: conversation,
    });

    const raw = extractText(response.content);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        `AnthropicLlmClient: judge response was not valid JSON. Raw: ${raw.slice(0, 200)}`,
      );
    }

    if (!isJudgeResult(parsed)) {
      throw new Error(
        `AnthropicLlmClient: judge response did not match expected JudgeResult shape. Raw: ${raw.slice(0, 200)}`,
      );
    }

    return parsed;
  }

  return { chat, judge };
}
