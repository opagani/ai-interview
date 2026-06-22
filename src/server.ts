// Cloudflare Workers entry — wires the real D1 repository and delegates to
// createApp. The ONLY place prod adapters are constructed.

import { D1LinkRepository } from "./links/d1-repository";
import { createApp } from "./app";

export interface Env {
  DB: D1Database;
  BASE_URL: string;
}

const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 7;

/** Generate a cryptographically random 7-char base62 slug. Workers-compatible. */
function generateSlug(): string {
  const bytes = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(bytes);
  let slug = "";
  for (const byte of bytes) {
    // Modulo bias: 256 % 62 = 8, so residues 0–7 are ~25% more likely.
    // Slugs are public IDs, not secrets — 41-bit keyspace + retry on collision
    // makes the bias inconsequential.
    slug += BASE62[byte % BASE62.length];
  }
  return slug;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const repo = new D1LinkRepository(env.DB);
    const app = createApp({ repo, slug: generateSlug, baseUrl: env.BASE_URL });
    return app.fetch(request);
  },
};
