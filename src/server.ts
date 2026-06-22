// Cloudflare Workers entry — wires the real D1 repository and delegates to
// createApp. The ONLY place prod adapters are constructed.
//
// STUB: D1LinkRepository (T10) and the wiring (T11) land in /build-loop.

import { createApp } from "./app";

export interface Env {
  DB: D1Database;
  BASE_URL: string;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    // TODO(T11): const repo = new D1LinkRepository(drizzle(env.DB));
    // const app = createApp({ repo, slug: base62(7), baseUrl: env.BASE_URL });
    // return app.fetch(request);
    void createApp; // keep the import live until wired
    return new Response(JSON.stringify({ error: "not_implemented" }), {
      status: 501,
      headers: { "content-type": "application/json" },
    });
  },
};
