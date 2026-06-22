// Pure type definitions for the LLM client boundary.
// No implementation lives here — concrete clients are injected via dependency injection.

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ScoreEntry = {
  topic?: string; // omitted on the overall entry
  score: number; // 1-5
  notes: string;
};

export type JudgeResult = {
  scores: ScoreEntry[];
  overall: ScoreEntry;
};

export interface LlmClient {
  chat(messages: ChatMessage[]): Promise<string>;
  judge(transcript: ChatMessage[]): Promise<JudgeResult>;
}
