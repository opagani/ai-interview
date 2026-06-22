// Deployed entry point — pure routing + HTTP shaping. No business logic, no DB.
// createApp(deps) returns a Web-standard fetch handler (Workers + Bun).
//
// STUB: every route returns 501 until /build-loop wires the service (T8/T9).
// Specs drive THIS handler with a fake repo injected, so they are red now and
// turn green when the routing + service are implemented.

import type { LinkRepository } from "./links/repository";
import type { SlugGenerator } from "./links/service";

export interface AppDeps {
  readonly repo: LinkRepository;
  readonly slug: SlugGenerator;
  readonly baseUrl: string;
}

export interface FetchApp {
  fetch(request: Request): Promise<Response>;
}

export function createApp(_deps: AppDeps): FetchApp {
  return {
    async fetch(_request: Request): Promise<Response> {
      return new Response(JSON.stringify({ error: "not_implemented" }), {
        status: 501,
        headers: { "content-type": "application/json" },
      });
    },
  };
}
