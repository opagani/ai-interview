// React interview questions and answers.
// GET /api/quiz/react             → random question (no answer)
// GET /api/quiz/react?all=true    → all questions (no answers)
// GET /api/quiz/react/:id/answer  → answer for a specific question

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
    question: "What is the difference between state and props in React? Who owns each?",
    topic: "Fundamentals",
    hint: "One flows down from parent; the other is local to the component.",
  },
  {
    id: 2,
    difficulty: "easy",
    question: "What does the dependency array in useEffect do? What happens if you omit it entirely?",
    topic: "Hooks",
    hint: "Think about when the effect runs: every render, once, or when specific values change.",
  },
  {
    id: 3,
    difficulty: "easy",
    question: "What is the virtual DOM and why does React use it?",
    topic: "Fundamentals",
    hint: "Think about the cost of real DOM mutations vs. diffing in memory.",
  },
  {
    id: 4,
    difficulty: "easy",
    question: "When would you use useRef instead of useState? Give a concrete example.",
    topic: "Hooks",
    hint: "useRef doesn't trigger a re-render when it changes.",
  },
  {
    id: 5,
    difficulty: "medium",
    question: "What is the difference between useMemo and useCallback? When does each actually help performance?",
    topic: "Performance",
    hint: "One memoizes a value; the other memoizes a function reference.",
  },
  {
    id: 6,
    difficulty: "medium",
    question: "Explain the React reconciliation algorithm. How does React decide which DOM nodes to update?",
    topic: "Internals",
    hint: "Keys matter here — especially in lists.",
  },
  {
    id: 7,
    difficulty: "medium",
    question: "What problem does useContext solve, and what are its performance trade-offs compared to a state manager like Zustand?",
    topic: "State Management",
    hint: "Every consumer re-renders when the context value changes.",
  },
  {
    id: 8,
    difficulty: "medium",
    question: "What is prop drilling, and what are three ways to avoid it?",
    topic: "Patterns",
    hint: "Context, composition, and external state managers are all valid answers.",
  },
  {
    id: 9,
    difficulty: "medium",
    question: "What is a custom hook and what rules must it follow? Why can't you call hooks inside a condition?",
    topic: "Hooks",
    hint: "React relies on hook call order being stable across renders.",
  },
  {
    id: 10,
    difficulty: "hard",
    question: "Explain React's concurrent mode. What is a transition, and how does startTransition improve perceived performance?",
    topic: "Concurrent React",
    hint: "Transitions mark updates as non-urgent — React can interrupt them.",
  },
  {
    id: 11,
    difficulty: "hard",
    question: "What is the difference between a controlled and uncontrolled component? When would you prefer uncontrolled?",
    topic: "Forms",
    hint: "Controlled = React owns the value. Uncontrolled = the DOM owns it.",
  },
];

export const ANSWERS: readonly Answer[] = [
  {
    id: 1,
    answer:
      "Props are read-only values passed from a parent component — the child cannot change them. State is local, mutable data owned by the component itself. When state changes, React re-renders that component and its children. Props change only when the parent re-renders with new values.",
  },
  {
    id: 2,
    answer:
      "The dependency array tells React when to re-run the effect. An empty array `[]` means 'run once after mount'. A list of values means 'run again whenever any of these change'. Omitting the array entirely means 'run after every render' — almost always a bug, and can cause infinite loops if the effect sets state.",
  },
  {
    id: 3,
    answer:
      "The virtual DOM is an in-memory representation of the real DOM. When state changes, React re-renders to a new virtual DOM tree, diffs it against the previous one (reconciliation), and only applies the minimal set of real DOM mutations needed. Real DOM operations are expensive; diffing in memory is cheap.",
  },
  {
    id: 4,
    answer:
      "useRef persists a mutable value across renders without triggering a re-render when it changes. Common uses: storing a DOM node reference (`ref.current = <input>`), keeping a previous value for comparison, or storing a timer ID (`clearTimeout(timerRef.current)`). If you need to react to a value change in the UI, use useState instead.",
  },
  {
    id: 5,
    answer:
      "useMemo memoizes a computed value — useful when a calculation is expensive and its inputs rarely change. useCallback memoizes a function reference — useful when passing callbacks to child components wrapped in React.memo, so the child doesn't re-render just because the parent re-rendered. Both are premature optimization if used blindly; profile first.",
  },
  {
    id: 6,
    answer:
      "React diffs the virtual DOM tree level by level. Two rules: (1) Elements of different types produce entirely different trees. (2) For lists, React uses the `key` prop to match elements across renders. Without stable keys, React can't tell which item moved vs. changed, leading to incorrect updates and poor performance. Keys must be stable, unique, and not index-based for dynamic lists.",
  },
  {
    id: 7,
    answer:
      "useContext lets any descendant read a value without prop drilling. The trade-off: every component that calls useContext re-renders whenever the context value changes — even if it only uses part of the value. Zustand (and similar libraries) let components subscribe to specific slices, so only components that care about a changed field re-render. For infrequently-changing values (theme, locale), Context is fine.",
  },
  {
    id: 8,
    answer:
      "Prop drilling is passing data through many intermediate components that don't use it — just to get it to a deeply nested child. Three ways to avoid it: (1) React Context — share values across the tree without passing through intermediaries. (2) Component composition — lift the child that needs the data up and pass it as a child/render prop. (3) External state manager (Zustand, Redux) — any component subscribes directly to the store.",
  },
  {
    id: 9,
    answer:
      "A custom hook is a function whose name starts with `use` that calls other hooks. React's rules: only call hooks at the top level (not inside conditionals, loops, or nested functions), and only call them from React functions. The reason: React tracks hook state by call order. If you call a hook conditionally, the order can change between renders, and React loses track of which state belongs to which hook.",
  },
  {
    id: 10,
    answer:
      "Concurrent mode lets React interrupt, pause, and resume rendering. A 'transition' marks an update as non-urgent — `startTransition(() => setState(...))` tells React it can delay this update if something more urgent (like a user keystroke) comes in. This keeps the UI responsive during expensive re-renders. Without transitions, a slow render blocks the main thread and the UI feels frozen.",
  },
  {
    id: 11,
    answer:
      "Controlled: React state drives the input value (`value={state}` + `onChange`). React is the single source of truth. Uncontrolled: the DOM manages the value; you read it via a ref when needed. Uncontrolled is simpler for file inputs (which React can't control) and for large forms where you only need the value on submit — avoiding re-renders on every keystroke.",
  },
];

export function findQuestion(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function findAnswer(id: number): Answer | undefined {
  return ANSWERS.find((a) => a.id === id);
}
