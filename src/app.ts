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

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TechScreen Interview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; display: flex; flex-direction: column; height: 100vh; }
    #header { background: #1a1a2e; color: #fff; padding: 12px 20px; font-size: 1rem; font-weight: 600; }
    #messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .msg { max-width: 75%; padding: 10px 14px; border-radius: 12px; line-height: 1.5; font-size: 0.95rem; white-space: pre-wrap; word-break: break-word; }
    .msg.assistant { background: #fff; border: 1px solid #e0e0e0; align-self: flex-start; }
    .msg.user { background: #1a1a2e; color: #fff; align-self: flex-end; }
    .msg.error { background: #fee2e2; border: 1px solid #fca5a5; align-self: flex-start; color: #991b1b; }
    #input-area { display: flex; gap: 8px; padding: 16px; background: #fff; border-top: 1px solid #e0e0e0; }
    #answer { flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; resize: none; outline: none; }
    #answer:focus { border-color: #1a1a2e; }
    #submit { padding: 10px 20px; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; font-size: 0.95rem; cursor: pointer; }
    #submit:disabled { opacity: 0.5; cursor: not-allowed; }
    #results { display: none; padding: 24px; background: #fff; border-radius: 12px; margin: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    #results h2 { margin-bottom: 16px; color: #1a1a2e; }
    .topic-score { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .topic-score:last-child { border-bottom: none; }
    .topic-notes { font-size: 0.85rem; color: #555; margin-top: 2px; }
    #overall-notes { margin-top: 16px; padding: 12px; background: #f0f9ff; border-left: 4px solid #1a1a2e; font-style: italic; }
  </style>
</head>
<body>
  <div id="header">TechScreen Interview</div>
  <div id="messages"></div>
  <div id="input-area">
    <textarea id="answer" rows="3" placeholder="Type your answer…" disabled></textarea>
    <button id="submit" disabled>Send</button>
  </div>
  <div id="results"></div>
  <script>
    (function () {
      const TOKEN = ${JSON.stringify(token)};
      const BASE = '/api/sessions/' + TOKEN;
      const messagesEl = document.getElementById('messages');
      const answerEl = document.getElementById('answer');
      const submitEl = document.getElementById('submit');
      const resultsEl = document.getElementById('results');
      const inputAreaEl = document.getElementById('input-area');

      function addMessage(role, text) {
        const div = document.createElement('div');
        div.className = 'msg ' + role;
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function setInputEnabled(enabled) {
        answerEl.disabled = !enabled;
        submitEl.disabled = !enabled;
        if (enabled) answerEl.focus();
      }

      async function sendTurn(answer) {
        setInputEnabled(false);
        try {
          const res = await fetch(BASE + '/turns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer }),
          });
          const data = await res.json();
          if (!res.ok) {
            addMessage('error', 'Error: ' + (data.error || res.status));
            setInputEnabled(true);
            return;
          }
          if (data.message) {
            addMessage('assistant', data.message);
          }
          if (data.isComplete) {
            await finishInterview();
          } else {
            setInputEnabled(true);
          }
        } catch (err) {
          addMessage('error', 'Network error. Please refresh.');
        }
      }

      async function finishInterview() {
        try {
          await fetch(BASE + '/complete', { method: 'POST' });
          const res = await fetch(BASE + '/results');
          const data = await res.json();
          inputAreaEl.style.display = 'none';
          showResults(data);
        } catch (err) {
          addMessage('error', 'Failed to load results. Please refresh.');
        }
      }

      function showResults(data) {
        const topics = (data.topics || []).map(function (t) {
          return '<div class="topic-score"><div><strong>' + escHtml(t.topic) + '</strong>'
            + '<div class="topic-notes">' + escHtml(t.notes) + '</div></div>'
            + '<div><strong>' + t.score + '/5</strong></div></div>';
        }).join('');
        resultsEl.innerHTML = '<h2>Interview Complete</h2>'
          + topics
          + '<div id="overall-notes">' + escHtml((data.overall || {}).notes || '') + '</div>';
        resultsEl.style.display = 'block';
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }

      function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      submitEl.addEventListener('click', function () {
        const text = answerEl.value.trim();
        if (!text) return;
        addMessage('user', text);
        answerEl.value = '';
        void sendTurn(text);
      });

      answerEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitEl.click();
        }
      });

      // Kick off the interview by requesting the first question
      void sendTurn(null);
    })();
  </script>
</body>
</html>`;
}

function resultsPage(token: string, overallNotes: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TechScreen Results</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); padding: 32px; max-width: 600px; width: 100%; }
    h1 { color: #1a1a2e; margin-bottom: 24px; font-size: 1.4rem; }
    .overall-notes { padding: 14px; background: #f0f9ff; border-left: 4px solid #1a1a2e; font-style: italic; color: #1e3a5f; margin-bottom: 24px; line-height: 1.5; }
    p.label { color: #555; font-size: 0.85rem; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Interview Results</h1>
    <p class="label">Overall feedback</p>
    <div class="overall-notes">${escHtml(overallNotes)}</div>
  </div>
</body>
</html>`;
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
