// LinkRepository port — the seam between logic and storage.
// Prod impl: D1LinkRepository (Drizzle/D1). Test impl: fakeLinkRepository.

export interface Link {
  readonly id: number;
  readonly slug: string;
  readonly targetUrl: string;
  readonly createdAt: Date;
}

export interface NewLink {
  readonly slug: string;
  readonly targetUrl: string;
}

export interface LinkRepository {
  /** Insert a link. Rejects if the slug already exists (unique index). */
  insert(link: NewLink): Promise<Link>;
  findBySlug(slug: string): Promise<Link | undefined>;
  recordClick(linkId: number): Promise<void>;
  countClicks(linkId: number): Promise<number>;
}
