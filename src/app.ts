// Deployed entry point — pure routing + HTTP shaping. No business logic, no DB.
// createApp(deps) returns a Web-standard fetch handler (Workers + Bun).

import type { LinkRepository } from "./links/repository";
import type { SlugGenerator } from "./links/service";
import { createLink, getStats, resolveSlug } from "./links/service";
import { QUESTIONS as TS_Q, findQuestion as tsQ, findAnswer as tsA } from "./quiz-typescript";
import { QUESTIONS as REACT_Q, findQuestion as reactQ, findAnswer as reactA } from "./quiz-react";
import { QUESTIONS as PYTHON_Q, findQuestion as pythonQ, findAnswer as pythonA } from "./quiz-python";
import { QUESTIONS as AI_Q, findQuestion as aiQ, findAnswer as aiA } from "./quiz-ai";
import { renderFrontend } from "./frontend";

type QuizTopic = "typescript" | "react" | "python" | "ai";

const QUIZ = {
  typescript: { questions: TS_Q, findQ: tsQ, findA: tsA },
  react:      { questions: REACT_Q, findQ: reactQ, findA: reactA },
  python:     { questions: PYTHON_Q, findQ: pythonQ, findA: pythonA },
  ai:         { questions: AI_Q, findQ: aiQ, findA: aiA },
} satisfies Record<QuizTopic, unknown>;

export interface AppDeps {
  readonly repo: LinkRepository;
  readonly slug: SlugGenerator;
  readonly baseUrl: string;
}

export interface FetchApp {
  fetch(request: Request): Promise<Response>;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const STATS_RE = /^\/api\/links\/([^/]+)\/stats$/;

export function createApp(deps: AppDeps): FetchApp {
  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const { pathname } = url;

      // GET / — frontend
      if (pathname === "/" && request.method === "GET") {
        return new Response(renderFrontend(deps.baseUrl), {
          headers: { "content-type": "text/html;charset=UTF-8" },
        });
      }

      // GET /api/quiz/:topic          → random question
      // GET /api/quiz/:topic?all=true → all questions
      // GET /api/quiz/:topic/:id/answer
      const quizTopicMatch = /^\/api\/quiz\/(typescript|react|python|ai)/.exec(pathname);
      if (quizTopicMatch !== null && request.method === "GET") {
        const topic = quizTopicMatch[1] as QuizTopic;
        const quiz = QUIZ[topic];

        const answerMatch = /^\/api\/quiz\/(?:typescript|react|python|ai)\/(\d+)\/answer$/.exec(pathname);
        if (answerMatch !== null) {
          const id = parseInt(answerMatch[1] as string, 10);
          const question = quiz.findQ(id);
          if (question === undefined) return json({ error: "not_found" }, 404);
          const answer = quiz.findA(id);
          return json({ ...question, ...answer });
        }

        const all = url.searchParams.get("all");
        if (all === "true") return json(quiz.questions);
        const q = quiz.questions[Math.floor(Math.random() * quiz.questions.length)];
        return json(q);
      }

      // POST /links — shorten a URL
      if (pathname === "/links" && request.method === "POST") {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_url" }, 400);
        }

        const rawBody = body as Record<string, unknown>;
        if (typeof rawBody.url !== "string") {
          return json({ error: "invalid_url" }, 400);
        }

        const result = await createLink(deps, { url: rawBody.url });

        if (!result.ok) {
          const status = result.error === "invalid_url" ? 400 : 409;
          return json({ error: result.error }, status);
        }

        return json(result.value, 201);
      }

      const statsMatch = STATS_RE.exec(pathname);
      if (statsMatch !== null && request.method === "GET") {
        const slug = statsMatch[1] as string;
        const result = await getStats(deps, slug);
        if (!result.ok) {
          return json({ error: result.error }, 404);
        }
        return json(result.value);
      }

      // GET /{slug} — redirect to target URL
      const slugMatch = /^\/([^/]+)$/.exec(pathname);
      if (slugMatch !== null && request.method === "GET") {
        const slug = slugMatch[1] as string;
        const result = await resolveSlug(deps, slug);
        if (!result.ok) {
          return json({ error: result.error }, 404);
        }
        return new Response(null, {
          status: 302,
          headers: { location: result.value.targetUrl },
        });
      }

      return json({ error: "not_found" }, 404);
    },
  };
}
