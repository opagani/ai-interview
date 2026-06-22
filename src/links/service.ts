// Link service — pure-ish functions over injected deps. Returns Result for
// expected failures; never throws for them.

import type { Result } from "../shared/result";
import { ok, err } from "../shared/result";
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
  readonly baseUrl: string;
}

export interface CreatedLink {
  readonly slug: string;
  readonly shortUrl: string;
  readonly targetUrl: string;
}

const MAX_SLUG_RETRIES = 10;

function isValidUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createLink(
  deps: LinkServiceDeps,
  input: { url: string },
): Promise<Result<CreatedLink, CreateLinkError>> {
  if (!isValidUrl(input.url)) {
    return err("invalid_url");
  }

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const slug = deps.slug();
    try {
      await deps.repo.insert({ slug, targetUrl: input.url });
      return ok({
        slug,
        shortUrl: `${deps.baseUrl}/${slug}`,
        targetUrl: input.url,
      });
    } catch {
      // Slug collision — try again with a fresh slug
      continue;
    }
  }

  return err("slug_taken");
}

export async function resolveSlug(
  deps: LinkServiceDeps,
  slug: string,
): Promise<Result<Link, ResolveError>> {
  const link = await deps.repo.findBySlug(slug);
  if (link === undefined) {
    return err("not_found");
  }
  await deps.repo.recordClick(link.id);
  return ok(link);
}

export async function getStats(
  deps: LinkServiceDeps,
  slug: string,
): Promise<Result<LinkStats, ResolveError>> {
  const link = await deps.repo.findBySlug(slug);
  if (link === undefined) {
    return err("not_found");
  }
  const clicks = await deps.repo.countClicks(link.id);
  return ok({ slug: link.slug, targetUrl: link.targetUrl, clicks });
}
