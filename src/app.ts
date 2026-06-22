// Deployed entry point for TechScreen.
// Hand-rolled URL router using Web standard APIs only — no framework, no Bun-only APIs.

import type { SessionRepository } from "./sessions/repository";
import type { LlmClient } from "./llm/client";
import type { Question } from "./sessions/questions";
import { createSession } from "./sessions/service.create";
import { submitAnswer } from "./sessions/service.submit";
import { completeAndScore } from "./sessions/service.complete";
import { getResults } from "./sessions/service.results";

export type AppDeps = {
  repo: SessionRepository;
  llm: LlmClient;
  questions: Question[];
  adminToken: string;
  baseUrl: string;
};

type ServiceErrorCode =
  | "unauthorized"
  | "not_found"
  | "session_closed"
  | "interview_in_progress"
  | "results_not_ready"
  | "llm_failed"
  | "judge_failed";

function errorStatus(code: ServiceErrorCode): number {
  switch (code) {
    case "unauthorized":
      return 401;
    case "not_found":
      return 404;
    case "session_closed":
    case "interview_in_progress":
    case "results_not_ready":
      return 409;
    case "llm_failed":
    case "judge_failed":
      return 502;
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function htmlResponse(html: string, status: number): Response {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function extractBearer(request: Request): string {
  const auth = request.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(auth);
  return match?.[1] ?? "";
}

/** Extracts the path segment at position `index` (0-based, after splitting on '/'). */
function pathSegment(pathname: string, index: number): string | undefined {
  // pathname always starts with '/', so split produces an empty string at [0].
  return pathname.split("/")[index + 1];
}

function chatPage(token: string): string {
  return `<!DOCTYPE html><html><body><p>Interview: ${token}</p></body></html>`;
}

function resultsPage(token: string, overallNotes: string): string {
  return `<!DOCTYPE html><html><body><p>Results for ${token}</p><p>${overallNotes}</p></body></html>`;
}

export function createApp(deps: AppDeps): { fetch: (request: Request) => Promise<Response> } {
  const { repo, llm, questions, adminToken, baseUrl } = deps;

  async function handleFetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // POST /api/sessions
    if (method === "POST" && pathname === "/api/sessions") {
      const providedToken = extractBearer(request);
      const result = await createSession(
        { repo, adminToken, baseUrl },
        { providedToken },
      );
      if (!result.ok) {
        return jsonResponse({ error: result.error }, errorStatus(result.error));
      }
      return jsonResponse(result.value, 201);
    }

    // GET /interview/:token
    if (method === "GET" && pathname.startsWith("/interview/")) {
      const token = pathSegment(pathname, 1);
      if (token === undefined || token === "") {
        return htmlResponse("<p>Not found</p>", 404);
      }

      const session = await repo.findByToken(token);
      if (session === null) {
        return htmlResponse("<p>Not found</p>", 404);
      }

      if (session.status === "complete") {
        const scoresResult = await getResults({ repo }, { token });
        const notes = scoresResult.ok ? scoresResult.value.overall.notes : "";
        return htmlResponse(resultsPage(token, notes), 200);
      }

      return htmlResponse(chatPage(token), 200);
    }

    // POST /api/sessions/:token/turns
    if (method === "POST" && /^\/api\/sessions\/[^/]+\/turns$/.test(pathname)) {
      const token = pathSegment(pathname, 2);
      if (token === undefined) {
        return jsonResponse({ error: "not_found" }, 404);
      }

      let answer: string | null = null;
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const raw = body["answer"];
        answer = raw === null || raw === undefined ? null : String(raw);
      } catch {
        return jsonResponse({ error: "not_found" }, 400);
      }

      const result = await submitAnswer(
        { repo, llm, questions },
        { token, answer },
      );
      if (!result.ok) {
        return jsonResponse({ error: result.error }, errorStatus(result.error));
      }
      return jsonResponse(result.value, 200);
    }

    // POST /api/sessions/:token/complete
    if (method === "POST" && /^\/api\/sessions\/[^/]+\/complete$/.test(pathname)) {
      const token = pathSegment(pathname, 2);
      if (token === undefined) {
        return jsonResponse({ error: "not_found" }, 404);
      }

      const result = await completeAndScore({ repo, llm }, { token });
      if (!result.ok) {
        return jsonResponse({ error: result.error }, errorStatus(result.error));
      }
      return jsonResponse(result.value, 200);
    }

    // GET /api/sessions/:token/results
    if (method === "GET" && /^\/api\/sessions\/[^/]+\/results$/.test(pathname)) {
      const token = pathSegment(pathname, 2);
      if (token === undefined) {
        return jsonResponse({ error: "not_found" }, 404);
      }

      const result = await getResults({ repo }, { token });
      if (!result.ok) {
        return jsonResponse({ error: result.error }, errorStatus(result.error));
      }
      return jsonResponse(result.value, 200);
    }

    return jsonResponse({ error: "not_found" }, 404);
  }

  return { fetch: handleFetch };
}
