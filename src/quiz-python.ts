// Python interview questions and answers.
// GET /api/quiz/python             → random question (no answer)
// GET /api/quiz/python?all=true    → all questions (no answers)
// GET /api/quiz/python/:id/answer  → answer for a specific question

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
    question: "What is the difference between a list and a tuple in Python? When would you choose one over the other?",
    topic: "Data Structures",
    hint: "One is mutable, one is immutable — and immutability has consequences for hashing.",
  },
  {
    id: 2,
    difficulty: "easy",
    question: "What does the `__init__` method do in a Python class, and how does it differ from `__new__`?",
    topic: "OOP",
    hint: "__new__ creates the instance; __init__ initializes it.",
  },
  {
    id: 3,
    difficulty: "easy",
    question: "What is a Python decorator and how does it work? Write the signature of a simple decorator.",
    topic: "Functions",
    hint: "A decorator is a function that takes a function and returns a function.",
  },
  {
    id: 4,
    difficulty: "easy",
    question: "What is the difference between `==` and `is` in Python?",
    topic: "Fundamentals",
    hint: "One checks value equality; the other checks object identity.",
  },
  {
    id: 5,
    difficulty: "medium",
    question: "What is a generator in Python? How does `yield` differ from `return`, and why would you use a generator over a list?",
    topic: "Iterators",
    hint: "Think about memory — a generator produces values lazily.",
  },
  {
    id: 6,
    difficulty: "medium",
    question: "Explain Python's GIL (Global Interpreter Lock). How does it affect CPU-bound vs I/O-bound concurrency?",
    topic: "Concurrency",
    hint: "Threading helps I/O-bound work; multiprocessing is needed for CPU-bound.",
  },
  {
    id: 7,
    difficulty: "medium",
    question: "What are *args and **kwargs? When would you use each, and what order must they appear in a function signature?",
    topic: "Functions",
    hint: "One captures positional arguments as a tuple; the other captures keyword arguments as a dict.",
  },
  {
    id: 8,
    difficulty: "medium",
    question: "What is the difference between `@classmethod` and `@staticmethod`? When would you use each?",
    topic: "OOP",
    hint: "classmethod receives the class as first arg; staticmethod receives neither self nor cls.",
  },
  {
    id: 9,
    difficulty: "medium",
    question: "What is a context manager and how do you implement one? Give an example beyond file handling.",
    topic: "Patterns",
    hint: "__enter__ and __exit__ — or use the contextlib.contextmanager decorator.",
  },
  {
    id: 10,
    difficulty: "hard",
    question: "What are Python descriptors? How do `__get__`, `__set__`, and `__delete__` work, and how does Python use them for properties?",
    topic: "Advanced OOP",
    hint: "`property` is itself a descriptor. Descriptors live on the class, not the instance.",
  },
  {
    id: 11,
    difficulty: "hard",
    question: "What is the difference between `asyncio`, `threading`, and `multiprocessing` in Python? When would you choose each?",
    topic: "Concurrency",
    hint: "asyncio = single thread, cooperative; threading = I/O-bound, GIL limited; multiprocessing = CPU-bound, separate processes.",
  },
];

export const ANSWERS: readonly Answer[] = [
  {
    id: 1,
    answer:
      "Lists are mutable (you can append, remove, change elements); tuples are immutable. Use a tuple when the data shouldn't change — coordinates, RGB values, database rows — and when you need it to be hashable (e.g. as a dict key or set member). Lists are for collections that grow or change. Tuples are also slightly faster to iterate.",
  },
  {
    id: 2,
    answer:
      "`__new__` is the class method that actually creates and returns the new instance (allocates memory). `__init__` receives the already-created instance (`self`) and initializes its attributes. You almost never override `__new__` — only when subclassing immutable types like `int` or `str`, or implementing singleton patterns. `__init__` is where you set `self.x = x` and so on.",
  },
  {
    id: 3,
    answer:
      "A decorator is a callable that takes a function, wraps it, and returns the wrapper. Basic signature: `def my_decorator(func): def wrapper(*args, **kwargs): ... return func(*args, **kwargs); return wrapper`. Applied with `@my_decorator` above the function definition. Used for cross-cutting concerns: logging, timing, auth checks, caching — without modifying the original function.",
  },
  {
    id: 4,
    answer:
      "`==` calls `__eq__` and checks value equality — two different objects can be `==` if they hold the same value. `is` checks object identity — whether two names point to the exact same object in memory (`id(a) == id(b)`). Common trap: small integers (-5 to 256) and interned strings are cached, so `a is b` can be True by accident. Always use `==` for value comparison; `is` only for `None`, `True`, `False`.",
  },
  {
    id: 5,
    answer:
      "A generator is a function that uses `yield` to produce values one at a time, pausing execution between each. `return` exits the function and returns a value once; `yield` suspends the function and hands a value to the caller, resuming from that point on the next call. Generators are memory-efficient for large sequences — they produce values on demand rather than building the whole list in memory. Example: reading a 10GB log file line by line.",
  },
  {
    id: 6,
    answer:
      "The GIL is a mutex that allows only one thread to execute Python bytecode at a time. For I/O-bound work (network, disk), threads work well — while one thread waits on I/O, the GIL is released and another thread runs. For CPU-bound work (number crunching, image processing), threads don't help because they can't run Python code in parallel. Use `multiprocessing` for CPU-bound work (separate processes, each with their own GIL), or libraries like NumPy that release the GIL in C extensions.",
  },
  {
    id: 7,
    answer:
      "`*args` collects extra positional arguments into a tuple. `**kwargs` collects extra keyword arguments into a dict. Order in signature: regular params → `*args` → keyword-only params → `**kwargs`. Example: `def f(a, b, *args, key=None, **kwargs)`. Use `*args` when a function should accept a variable number of positional inputs (like `print`); use `**kwargs` for flexible keyword options (like configuration).",
  },
  {
    id: 8,
    answer:
      "`@classmethod` receives the class (`cls`) as its first argument instead of the instance. Used for alternative constructors: `User.from_dict(data)`. `@staticmethod` receives neither `self` nor `cls` — it's just a regular function namespaced inside the class. Use `@classmethod` when the method needs access to the class itself (to create instances or access class variables); use `@staticmethod` for utility functions that logically belong to the class but don't need class or instance state.",
  },
  {
    id: 9,
    answer:
      "A context manager manages setup and teardown around a block of code (`with` statement). Implement with `__enter__` (called on entry, returns the value bound to `as`) and `__exit__` (called on exit, even if an exception occurred — receives exc_type, exc_val, traceback). Beyond files: database transactions (`with db.transaction()`), locks (`with threading.Lock()`), temporary directories, mocking in tests. Using `@contextlib.contextmanager`, put the setup before `yield` and teardown after.",
  },
  {
    id: 10,
    answer:
      "A descriptor is any object that defines `__get__`, `__set__`, or `__delete__`. When an attribute is accessed on an instance, Python checks the class (and its MRO) first — if it finds a descriptor, it calls `__get__` instead of returning the raw attribute. `property` is a built-in descriptor: `@property` wraps a method so attribute access calls `__get__`. This is how Python implements computed properties, type validation, and lazy loading without modifying the instance dict.",
  },
  {
    id: 11,
    answer:
      "`asyncio`: single-threaded, cooperative multitasking. Tasks yield control at `await` points. Best for high-concurrency I/O (thousands of network requests). No parallelism — one coroutine runs at a time. `threading`: OS threads, preemptive. Good for I/O-bound work where you use blocking libraries that don't support async. GIL limits CPU parallelism. `multiprocessing`: separate processes, each with own memory and GIL. True CPU parallelism. Overhead from process creation and inter-process communication. Use for CPU-bound work: data processing, ML inference, image resizing.",
  },
];

export function findQuestion(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function findAnswer(id: number): Answer | undefined {
  return ANSWERS.find((a) => a.id === id);
}
