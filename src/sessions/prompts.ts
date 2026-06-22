import type { Question } from "./questions";
import type { ChatMessage } from "../llm/client";

/**
 * Returns the system prompt for the interviewer role.
 * Instructs the LLM to act as a warm but professional technical interviewer,
 * ask the given question, follow up naturally, and never reveal the answer.
 */
export function buildInterviewerSystemPrompt(currentQuestion: Question): string {
  return `You are a warm but professional technical interviewer conducting a structured screening interview.

Your current topic is "${currentQuestion.topic}". Your current question is:
"${currentQuestion.prompt}"

Guidelines:
- Ask the question naturally and conversationally.
- Follow up on the candidate's answer with clarifying or probing questions relevant to their response.
- Do NOT reveal the correct answer, hint at it, or coach the candidate toward it.
- Stay strictly on the current topic and question — do not introduce new topics or questions yourself.
- Be encouraging but neutral; avoid praising or criticising answers in a way that reveals quality.
- Keep your messages concise and focused.`;
}

/**
 * Returns a user-role message that injects the next question into the conversation.
 * Used when advancing to a new question after the previous one has been answered.
 */
export function buildQuestionMessage(question: Question): string {
  return `[NEXT QUESTION — topic: ${question.topic}]
${question.prompt}`;
}

const JUDGE_SYSTEM_PROMPT = `You are an expert technical interview judge. You will be given a transcript of a technical screening interview.

Score the candidate on exactly these four topics: "typescript", "react", "python", "ai".

Use this rubric for every score:
1 = No working knowledge — could not answer basic questions
2 = Surface familiarity — aware of concepts but unable to apply them
3 = Solid working knowledge — can apply correctly in common scenarios
4 = Strong with tradeoff reasoning — understands edge cases and trade-offs
5 = Deep expertise — nuanced, authoritative, can teach and critique

Your response MUST be ONLY a single valid JSON object. No markdown fences. No prose before or after. No explanation. No code blocks.

The JSON must match this exact shape:
{
  "scores": [
    { "topic": "typescript", "score": <integer 1-5>, "notes": "<string>" },
    { "topic": "react", "score": <integer 1-5>, "notes": "<string>" },
    { "topic": "python", "score": <integer 1-5>, "notes": "<string>" },
    { "topic": "ai", "score": <integer 1-5>, "notes": "<string>" }
  ],
  "overall": { "score": <integer 1-5>, "notes": "<string>" }
}

Rules:
- "scores" must contain exactly four entries, one per topic listed above, in that order.
- Every score must be an integer between 1 and 5 inclusive.
- Every "notes" value must be a non-empty string.
- "overall" must not include a "topic" key.
- Output ONLY the JSON object. Any other text will be treated as a parse error.`;

/**
 * Returns the full set of messages to send to the LLM judge,
 * including a system prompt with the scoring rubric and the transcript as context.
 */
export function buildJudgeMessages(transcript: ChatMessage[]): ChatMessage[] {
  return [
    { role: "system", content: JUDGE_SYSTEM_PROMPT },
    ...transcript,
    {
      role: "user",
      content:
        "Based on the interview transcript above, produce the JSON scoring object now. Output ONLY the JSON.",
    },
  ];
}
