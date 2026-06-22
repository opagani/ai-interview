// TypeScript interview questions drawn from this codebase.
// GET /api/quiz          → random question
// GET /api/quiz?all=true → all questions

export interface Question {
  readonly id: number;
  readonly difficulty: "easy" | "medium" | "hard";
  readonly question: string;
  readonly file: string;
  readonly hint: string;
}

export const QUESTIONS: readonly Question[] = [
  {
    id: 1,
    difficulty: "easy",
    question:
      "In src/shared/result.ts, Result<T,E> is a discriminated union. What field acts as the discriminant, and what two literal types does it take?",
    file: "src/shared/result.ts",
    hint: "Look at the `ok` field on Ok<T> and Err<E>.",
  },
  {
    id: 2,
    difficulty: "easy",
    question:
      "src/shared/result.ts exports `isOk` and `isErr` as type guards. What syntax makes a function a type guard in TypeScript, and what does it buy you at the call site?",
    file: "src/shared/result.ts",
    hint: "The return type annotation uses `r is Ok<T>`.",
  },
  {
    id: 3,
    difficulty: "easy",
    question:
      "Every field on Ok<T> and Err<E> is marked `readonly`. What does `readonly` prevent, and does it give you deep immutability?",
    file: "src/shared/result.ts",
    hint: "Try reassigning `result.ok = false` in your head. What about `result.value.someNestedProp`?",
  },
  {
    id: 4,
    difficulty: "medium",
    question:
      "src/links/repository.ts defines `LinkRepository` as an interface with no imports. Why is keeping the port import-free important for testability?",
    file: "src/links/repository.ts",
    hint: "Think about what the fake repo in test/support/ has to implement.",
  },
  {
    id: 5,
    difficulty: "medium",
    question:
      "In src/links/service.ts, `createLink` takes `deps: LinkServiceDeps` rather than a class instance. What pattern is this, and what does it make easier?",
    file: "src/links/service.ts",
    hint: "The test injects a fake repo; production injects D1LinkRepository.",
  },
  {
    id: 6,
    difficulty: "medium",
    question:
      "tsconfig.json enables `exactOptionalPropertyTypes`. How does that differ from plain `strict`, and when would it catch a bug that `strict` alone wouldn't?",
    file: "tsconfig.json",
    hint: "Consider `{ foo?: string }` — can you assign `{ foo: undefined }` to it?",
  },
  {
    id: 7,
    difficulty: "medium",
    question:
      "tsconfig.json sets `noUncheckedIndexedAccess: true`. What type does `arr[0]` have under this flag, and why does that matter for the D1 query results in d1-repository.ts?",
    file: "src/links/d1-repository.ts",
    hint: "Look at how `rows[0]` is handled in `insert` and `findBySlug`.",
  },
  {
    id: 8,
    difficulty: "medium",
    question:
      "src/app.ts uses `body as Record<string, unknown>` after JSON.parse. Why `Record<string, unknown>` rather than `any`, and what does `unknown` force you to do before using a value?",
    file: "src/app.ts",
    hint: "Look at the `typeof rawBody.url !== 'string'` guard that follows.",
  },
  {
    id: 9,
    difficulty: "hard",
    question:
      "SlugGenerator in src/links/service.ts is typed as `() => string`. Why is it a function reference rather than a plain string, and what does that enable in the retry loop?",
    file: "src/links/service.ts",
    hint: "The generator is called inside the retry loop, not once up front.",
  },
  {
    id: 10,
    difficulty: "hard",
    question:
      "D1LinkRepository in src/links/d1-repository.ts uses a private class field `#db` rather than `private db`. What's the runtime difference between `#` and the `private` keyword?",
    file: "src/links/d1-repository.ts",
    hint: "`private` is erased at compile time. `#` is enforced by the JS engine.",
  },
  {
    id: 11,
    difficulty: "hard",
    question:
      "src/server.ts uses `verbatimModuleSyntax` (set in tsconfig). What does that flag require you to do differently when importing types, and why does it matter for the Workers bundler?",
    file: "tsconfig.json",
    hint: "Look at how type-only imports are written across the codebase — `import type`.",
  },
];
