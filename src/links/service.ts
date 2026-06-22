// Link service — pure-ish functions over injected deps. Returns Result for
// expected failures; never throws for them. STUBS until /build-loop (T5–T7).

import type { Result } from "../shared/result";
import type { Link, LinkRepository } from "./repository";

export type CreateLinkError = "invalid_url" | "slug_taken";
export type ResolveError = "not_found";

export interface LinkStats {
  readonly slug: string;
  readonly targetUrl: string;
  readonly clicks: number;
}

export type SlugGenerator = () => string;

export interface LinkServiceDeps {
  readonly repo: LinkRepository;
  readonly slug: SlugGenerator;
}

export function createLink(
  _deps: LinkServiceDeps,
  _input: { url: string },
): Promise<Result<Link, CreateLinkError>> {
  throw new Error("not implemented: createLink");
}

export function resolveSlug(
  _deps: LinkServiceDeps,
  _slug: string,
): Promise<Result<Link, ResolveError>> {
  throw new Error("not implemented: resolveSlug");
}

export function getStats(
  _deps: LinkServiceDeps,
  _slug: string,
): Promise<Result<LinkStats, ResolveError>> {
  throw new Error("not implemented: getStats");
}
