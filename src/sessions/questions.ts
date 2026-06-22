export type QuestionTopic = "typescript" | "react" | "python" | "ai";

export type Question = {
  readonly id: string;
  readonly topic: QuestionTopic;
  readonly prompt: string;
};

const QUESTION_BANK: Question[] = [
  // TypeScript
  {
    id: "ts-1",
    topic: "typescript",
    prompt:
      "What is the difference between `unknown` and `any`? When would you choose `unknown` over `any`, and what must you do before using a value typed as `unknown`?",
  },
  {
    id: "ts-2",
    topic: "typescript",
    prompt:
      "Explain how generics work in TypeScript. Write a generic `identity` function and a generic `first<T>` function that returns the first element of an array or `undefined` if it is empty.",
  },
  {
    id: "ts-3",
    topic: "typescript",
    prompt:
      "What is a discriminated union? Model a `Result<T, E>` type as a discriminated union and show how you would exhaustively handle both cases in a switch statement.",
  },
  {
    id: "ts-4",
    topic: "typescript",
    prompt:
      "What does `strict: true` enable in `tsconfig.json`? Name at least three checks it turns on and explain the bug each one prevents.",
  },

  // React
  {
    id: "react-1",
    topic: "react",
    prompt:
      "What are the Rules of Hooks? Why must hooks only be called at the top level and only inside React functions? What happens if you call a hook inside a conditional?",
  },
  {
    id: "react-2",
    topic: "react",
    prompt:
      "When should you reach for `useMemo` and `useCallback`? What problem do they solve, and what is the cost of overusing them? Give a concrete example where each is justified.",
  },
  {
    id: "react-3",
    topic: "react",
    prompt:
      "How does React's reconciliation algorithm use `key` props? What bugs arise from using array index as a key, and when is it acceptable?",
  },
  {
    id: "react-4",
    topic: "react",
    prompt:
      "What is the difference between a controlled and an uncontrolled component in React? Give an example of each and explain when you would prefer one over the other.",
  },

  // Python
  {
    id: "python-1",
    topic: "python",
    prompt:
      "What is the difference between a generator and a list in Python? When would you prefer a generator, and what are the memory implications of each?",
  },
  {
    id: "python-2",
    topic: "python",
    prompt:
      "Explain the difference between `__init__` and `__new__` in Python. When would you override `__new__`, and what must it return?",
  },
  {
    id: "python-3",
    topic: "python",
    prompt:
      "What is the Global Interpreter Lock (GIL) in CPython? How does it affect CPU-bound vs I/O-bound multi-threaded programs, and what alternatives exist when you need true parallelism?",
  },

  // AI
  {
    id: "ai-1",
    topic: "ai",
    prompt:
      "What is Retrieval-Augmented Generation (RAG)? Describe the typical pipeline from user query to final answer, and explain what problem RAG solves compared to relying solely on a model's parametric knowledge.",
  },
  {
    id: "ai-2",
    topic: "ai",
    prompt:
      "When would you choose fine-tuning over prompt engineering, and vice versa? What are the trade-offs in cost, maintenance, and flexibility between the two approaches?",
  },
  {
    id: "ai-3",
    topic: "ai",
    prompt:
      "What is an embedding vector, and what does distance (or cosine similarity) between two embeddings represent? How is this used in semantic search or RAG retrieval?",
  },
];

export default QUESTION_BANK;
