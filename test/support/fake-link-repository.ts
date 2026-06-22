// In-memory LinkRepository for specs — drives side effects through the port
// boundary, never through internals. Real test infrastructure, not a stub.

import type { Link, LinkRepository, NewLink } from "../../src/links/repository";

export interface FakeLinkRepository extends LinkRepository {
  /** Pre-seed a link without going through insert(). Returns it with an id. */
  seedLink(link: Omit<Link, "id">): Link;
  /** Inspect recorded clicks for assertions. */
  clickCountFor(linkId: number): number;
}

export function fakeLinkRepository(): FakeLinkRepository {
  const links: Link[] = [];
  const clicks: number[] = [];
  let seq = 1;

  return {
    async insert(n: NewLink): Promise<Link> {
      if (links.some((l) => l.slug === n.slug)) {
        throw new Error("unique constraint: slug");
      }
      const link: Link = {
        id: seq++,
        slug: n.slug,
        targetUrl: n.targetUrl,
        createdAt: new Date(0),
      };
      links.push(link);
      return link;
    },
    async findBySlug(slug: string): Promise<Link | null> {
      return links.find((l) => l.slug === slug) ?? null;
    },
    async recordClick(linkId: number): Promise<void> {
      clicks.push(linkId);
    },
    async countClicks(linkId: number): Promise<number> {
      return clicks.filter((id) => id === linkId).length;
    },
    seedLink(partial: Omit<Link, "id">): Link {
      const link: Link = { id: seq++, ...partial };
      links.push(link);
      return link;
    },
    clickCountFor(linkId: number): number {
      return clicks.filter((id) => id === linkId).length;
    },
  };
}
