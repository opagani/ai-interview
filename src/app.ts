// Deployed entry point — pure routing + HTTP shaping. No business logic, no DB.
// createApp(deps) returns a Web-standard fetch handler (Workers + Bun).

import type { LinkRepository } from "./links/repository";
import type { SlugGenerator } from "./links/service";
import { createLink, getStats, resolveSlug } from "./links/service";
import { QUESTIONS, findQuestion, findAnswer } from "./quiz";
import { renderFrontend } from "./frontend";

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

      // GET /api/quiz — TypeScript interview questions from this codebase
      if (pathname === "/api/quiz" && request.method === "GET") {
        const all = url.searchParams.get("all");
        if (all === "true") return json(QUESTIONS);
        const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        return json(q);
      }

      // GET /api/quiz/:id/answer
      const answerMatch = /^\/api\/quiz\/(\d+)\/answer$/.exec(pathname);
      if (answerMatch !== null && request.method === "GET") {
        const id = parseInt(answerMatch[1] as string, 10);
        const question = findQuestion(id);
        if (question === undefined) return json({ error: "not_found" }, 404);
        const answer = findAnswer(id);
        return json({ ...question, ...answer });
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
