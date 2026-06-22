// D1LinkRepository — production adapter implementing LinkRepository over
// Drizzle ORM + Cloudflare D1. Workers-compatible: no Bun APIs, no node:*.

import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { eq, count } from "drizzle-orm";
import { links, clicks } from "./schema";
import type { Link, NewLink, LinkRepository } from "./repository";

type Schema = { links: typeof links; clicks: typeof clicks };
type DB = DrizzleD1Database<Schema>;

/** Map a raw Drizzle row to the domain `Link` shape. */
function rowToLink(row: typeof links.$inferSelect): Link {
  return {
    id: row.id,
    slug: row.slug,
    targetUrl: row.targetUrl,
    createdAt: row.createdAt,
  };
}

export class D1LinkRepository implements LinkRepository {
  readonly #db: DB;

  constructor(d1: D1Database) {
    this.#db = drizzle(d1, { schema: { links, clicks } });
  }

  async insert(link: NewLink): Promise<Link> {
    const rows = await this.#db
      .insert(links)
      .values({ slug: link.slug, targetUrl: link.targetUrl })
      .returning();

    const row = rows[0];
    if (row === undefined) {
      throw new Error("D1LinkRepository.insert: no row returned after insert");
    }
    return rowToLink(row);
  }

  async findBySlug(slug: string): Promise<Link | undefined> {
    const rows = await this.#db
      .select()
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1);

    const row = rows[0];
    return row !== undefined ? rowToLink(row) : undefined;
  }

  async recordClick(linkId: number): Promise<void> {
    await this.#db.insert(clicks).values({ linkId });
  }

  async countClicks(linkId: number): Promise<number> {
    const rows = await this.#db
      .select({ total: count() })
      .from(clicks)
      .where(eq(clicks.linkId, linkId));

    return rows[0]?.total ?? 0;
  }

  toString(): string {
    return "D1LinkRepository";
  }

  toJSON(): Record<string, string> {
    return { type: "D1LinkRepository" };
  }
}
