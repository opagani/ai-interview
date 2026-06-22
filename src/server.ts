// Cloudflare Workers entry point for TechScreen.
// Wires production dependencies and delegates all routing to createApp.

import type { D1Database } from "@cloudflare/workers-types";
import { createApp } from "./app";
import { createD1SessionRepository } from "./sessions/repository.d1";
import { createAnthropicLlmClient } from "./llm/client.anthropic";
import QUESTION_BANK from "./sessions/questions";

type Env = {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  ADMIN_TOKEN: string;
  BASE_URL: string;
};

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const repo = createD1SessionRepository(env.DB);
    const llm = createAnthropicLlmClient(env.ANTHROPIC_API_KEY);
    const app = createApp({
      repo,
      llm,
      questions: QUESTION_BANK,
      adminToken: env.ADMIN_TOKEN,
      baseUrl: env.BASE_URL,
    });
    return app.fetch(request);
  },
};
