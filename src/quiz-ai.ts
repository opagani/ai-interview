// AI/LLM interview questions and answers.
// GET /api/quiz/ai             → random question (no answer)
// GET /api/quiz/ai?all=true    → all questions (no answers)
// GET /api/quiz/ai/:id/answer  → answer for a specific question

export interface Question {
  readonly id: number;
  readonly difficulty: "easy" | "medium" | "hard";
  readonly question: string;
  readonly topic: string;
  readonly hint: string;
}

export interface Answer {
  readonly id: number;
  readonly answer: string;
}

export const QUESTIONS: readonly Question[] = [
  {
    id: 1,
    difficulty: "easy",
    question: "What is a large language model (LLM)? What does it mean for a model to 'predict the next token'?",
    topic: "Fundamentals",
    hint: "LLMs are trained to predict probability distributions over vocabulary tokens.",
  },
  {
    id: 2,
    difficulty: "easy",
    question: "What is a prompt? What is the difference between a system prompt and a user prompt?",
    topic: "Prompting",
    hint: "System prompt sets context and behavior; user prompt is the actual request.",
  },
  {
    id: 3,
    difficulty: "easy",
    question: "What is 'temperature' in an LLM? What happens at temperature 0 vs temperature 1?",
    topic: "Parameters",
    hint: "Temperature controls randomness in token selection.",
  },
  {
    id: 4,
    difficulty: "easy",
    question: "What is a context window? Why does its size matter when building LLM applications?",
    topic: "Fundamentals",
    hint: "Think about what the model can 'see' at inference time.",
  },
  {
    id: 5,
    difficulty: "medium",
    question: "What is RAG (Retrieval-Augmented Generation)? What problem does it solve that fine-tuning doesn't?",
    topic: "Architecture",
    hint: "RAG retrieves fresh external knowledge at query time.",
  },
  {
    id: 6,
    difficulty: "medium",
    question: "What is an embedding? How are embeddings used for semantic search?",
    topic: "Embeddings",
    hint: "Embeddings map text to vectors in a high-dimensional space where similar meanings are close.",
  },
  {
    id: 7,
    difficulty: "medium",
    question: "What is 'hallucination' in LLMs? What techniques reduce it?",
    topic: "Reliability",
    hint: "Think about grounding — giving the model facts to work from.",
  },
  {
    id: 8,
    difficulty: "medium",
    question: "What is tool use (function calling) in LLMs? How does it extend what a model can do?",
    topic: "Agentic AI",
    hint: "The model outputs a structured call; your code executes it and returns the result.",
  },
  {
    id: 9,
    difficulty: "medium",
    question: "What is the difference between zero-shot, one-shot, and few-shot prompting?",
    topic: "Prompting",
    hint: "The 'shot' refers to how many examples you include in the prompt.",
  },
  {
    id: 10,
    difficulty: "hard",
    question: "What is the transformer attention mechanism? What does 'self-attention' compute, and why does it scale quadratically with sequence length?",
    topic: "Architecture",
    hint: "Attention computes dot products between every pair of tokens in the sequence.",
  },
  {
    id: 11,
    difficulty: "hard",
    question: "What is an AI agent? What are the key components of an agent loop, and what are the biggest failure modes?",
    topic: "Agentic AI",
    hint: "Agents combine an LLM with tools, memory, and a loop that runs until a goal is reached.",
  },
];

export const ANSWERS: readonly Answer[] = [
  {
    id: 1,
    answer:
      "An LLM is a neural network trained on large text corpora to predict the probability of the next token (a word, subword, or character) given all previous tokens. At inference time, the model samples from this distribution repeatedly to generate text. The 'large' refers to billions of parameters. Despite the simple training objective, emergent capabilities — reasoning, coding, translation — arise at scale.",
  },
  {
    id: 2,
    answer:
      "A prompt is the text input sent to an LLM. The system prompt (set by the developer) establishes the model's persona, constraints, and context — it persists across the conversation. The user prompt is the human's actual message. In Claude's API, these map to the `system` parameter and the `user` role in messages. The system prompt is invisible to the end user and is used to control behavior, set guardrails, and provide background knowledge.",
  },
  {
    id: 3,
    answer:
      "Temperature scales the logits (raw scores) before sampling. At temperature 0, the model always picks the highest-probability token — deterministic and repetitive. At temperature 1, probabilities are unchanged — balanced creativity and coherence. Above 1, low-probability tokens become more likely — creative but prone to incoherence. For code generation use low temperature (0–0.2); for creative writing use higher (0.7–1.0).",
  },
  {
    id: 4,
    answer:
      "The context window is the maximum number of tokens the model can process in a single inference — both input and output combined. It matters because the model can only 'see' and 'reason over' what's in the window. Long documents, conversation history, and tool results all consume context. If your content exceeds the window, you must truncate or chunk — which can cause the model to lose critical information. Larger windows (1M tokens in Claude) enable processing entire codebases or books at once.",
  },
  {
    id: 5,
    answer:
      "RAG retrieves relevant documents from an external knowledge base at query time and injects them into the prompt. Fine-tuning bakes knowledge into model weights — it's expensive to update and can't incorporate real-time data. RAG is cheaper, updatable (just update the knowledge base), and more traceable (you know what the model read). It solves hallucination on proprietary or recent data that wasn't in the training set. Trade-off: retrieval quality gates answer quality.",
  },
  {
    id: 6,
    answer:
      "An embedding is a dense vector (list of floats) that represents text in a high-dimensional space, where semantically similar texts are closer together (measured by cosine similarity or dot product). For semantic search: embed the user query → find the K nearest vectors in a pre-embedded document store (vector DB) → return those documents as context. Unlike keyword search, this matches meaning not exact words: 'car' and 'automobile' are close in embedding space.",
  },
  {
    id: 7,
    answer:
      "Hallucination is when an LLM generates plausible-sounding but false information — invented citations, wrong facts, made-up code. It happens because the model is optimized to produce fluent text, not truthful text. Mitigations: (1) RAG — ground answers in retrieved facts. (2) Ask the model to cite sources and verify them. (3) Lower temperature for factual tasks. (4) Chain-of-thought prompting slows the model down and surfaces reasoning errors. (5) Constitutional AI / RLHF training reduces it at the model level.",
  },
  {
    id: 8,
    answer:
      "Tool use lets you define functions (tools) with schemas. The LLM decides when to call a tool and outputs a structured JSON call; your code executes it and returns the result; the model continues with that result in context. This lets models act in the world: search the web, query databases, call APIs, run code — things a pure text model can't do. The model doesn't run the tool itself; it just requests the call. You control execution.",
  },
  {
    id: 9,
    answer:
      "Zero-shot: no examples in the prompt — just the instruction. The model uses its training to infer the task. One-shot: one example of input → output before the real request. Few-shot: 2–10 examples. More examples help the model understand the exact format, style, or reasoning pattern you want. Few-shot is especially powerful for unusual output formats or domain-specific tasks where the model might otherwise default to a generic behavior.",
  },
  {
    id: 10,
    answer:
      "Self-attention lets each token 'look at' every other token in the sequence to build context. For each token, it computes Query (what am I looking for?), Key (what do I contain?), and Value (what do I output?). Attention scores = softmax(Q·Kᵀ / √d), then weighted sum of Values. Quadratic scaling: with N tokens, you compute N² Q-K dot products. At 1M tokens, that's 10¹² operations — why long-context models need architectural tricks (sliding window, sparse attention, linear attention) to be practical.",
  },
  {
    id: 11,
    answer:
      "An AI agent is an LLM in a loop that perceives inputs, reasons about them, decides on actions (tool calls), executes them, observes results, and repeats until a goal is reached. Key components: (1) LLM for reasoning. (2) Tools for acting. (3) Memory (context window, vector store, or external DB). (4) Loop / orchestrator. Biggest failure modes: (1) Hallucinated tool calls — model invents arguments or calls non-existent tools. (2) Infinite loops — model never decides it's done. (3) Context overflow — history grows until the window is exhausted. (4) Cascading errors — early mistakes compound through subsequent steps.",
  },
];

export function findQuestion(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function findAnswer(id: number): Answer | undefined {
  return ANSWERS.find((a) => a.id === id);
}
