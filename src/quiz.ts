// TypeScript interview questions drawn from this codebase.
// GET /api/quiz             → random question (no answer)
// GET /api/quiz?all=true    → all questions (no answers)
// GET /api/quiz/:id/answer  → answer for a specific question

export interface Question {
  readonly id: number;
  readonly difficulty: "easy" | "medium" | "hard";
  readonly question: string;
  readonly file: string;
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

export const ANSWERS: readonly Answer[] = [
  {
    id: 1,
    answer:
      "The `ok` field is the discriminant. It's `true` on Ok<T> and `false` on Err<E>. TypeScript uses these literal types to narrow the union — after `if (result.ok)`, the compiler knows `result` is Ok<T> and `result.value` is safe to access.",
  },
  {
    id: 2,
    answer:
      "A type guard uses the `r is Ok<T>` return type annotation. At the call site, after `if (isOk(result))` the compiler narrows `result` from `Result<T,E>` to `Ok<T>` — so you can access `.value` without a cast. Without the guard, you'd need a manual `if (result.ok)` check every time.",
  },
  {
    id: 3,
    answer:
      "`readonly` prevents reassignment of the property itself (e.g. `result.ok = false` is a compile error). It does NOT give deep immutability — `result.value` is readonly, but if `value` is an object, its nested properties can still be mutated. For deep immutability you'd need `as const`, `Readonly<>` recursively, or an immutability library.",
  },
  {
    id: 4,
    answer:
      "Because it has zero imports, any module can implement it without pulling in Drizzle, D1, or any prod dependency. The fake repo in test/support/ is plain in-memory TypeScript — no ORM, no DB driver, no network. If the port imported Drizzle types, the fake would have to depend on Drizzle too, coupling tests to the production adapter.",
  },
  {
    id: 5,
    answer:
      "Dependency injection (specifically constructor/parameter injection). Instead of `this.repo` on a class, deps are passed as a plain object. This makes it trivial to swap the real D1 repo for a fake in tests — you just pass a different object that satisfies the same interface. No subclassing, no mocking framework needed.",
  },
  {
    id: 6,
    answer:
      "With plain `strict`, `{ foo?: string }` allows assigning `{ foo: undefined }` because optional is treated as `string | undefined`. With `exactOptionalPropertyTypes`, a missing key and an explicitly `undefined` value are distinct — `{ foo: undefined }` does NOT satisfy `{ foo?: string }`. This catches bugs where you spread an object with explicit `undefined` fields into a type that expects the key to simply be absent.",
  },
  {
    id: 7,
    answer:
      "`arr[0]` has type `T | undefined` instead of just `T`. This forces you to handle the case where the index is out of bounds. In d1-repository.ts, `rows[0]` after a Drizzle query has type `Row | undefined`, so `insert` explicitly checks `if (row === undefined)` before using it — without this flag that check would be optional and easy to forget.",
  },
  {
    id: 8,
    answer:
      "`any` turns off type checking entirely — you could access any property without the compiler complaining. `Record<string, unknown>` tells TypeScript 'this is an object with string keys, but the values are unknown'. `unknown` forces you to narrow the type (via `typeof`, `instanceof`, or a type guard) before you can use it. The `typeof rawBody.url !== 'string'` guard is exactly that narrowing — without it, TypeScript won't let you pass `rawBody.url` to a function expecting a string.",
  },
  {
    id: 9,
    answer:
      "A plain string would be generated once and reused on every retry — meaning every attempt collides on the same slug. As a function reference, `deps.slug()` is called on each loop iteration, producing a fresh random slug each time. This is the whole point of the retry loop: generate → try insert → if collision, generate a new one and try again.",
  },
  {
    id: 10,
    answer:
      "`private` is a TypeScript-only compile-time check — it's erased in the emitted JavaScript, so at runtime the field is fully accessible. `#` is a JavaScript private field (part of the ES2022 spec) — it's enforced by the JS engine itself. You genuinely cannot access `instance.#db` from outside the class at runtime, even in plain JS. `#` gives real encapsulation; `private` only gives a compile-time warning.",
  },
  {
    id: 11,
    answer:
      "`verbatimModuleSyntax` requires that type-only imports use `import type` explicitly (e.g. `import type { Foo } from './foo'`). Without it, TypeScript may silently elide imports it detects as type-only, which can confuse bundlers that don't run TypeScript themselves. Workers bundlers (esbuild under wrangler) process TS without full type information — `import type` is the explicit signal that an import has no runtime value and can be safely removed, preventing the bundler from trying to resolve or include it as a real module.",
  },
];

export function findQuestion(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function findAnswer(id: number): Answer | undefined {
  return ANSWERS.find((a) => a.id === id);
}
