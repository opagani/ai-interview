// Service: create a new candidate session.
// Expected failures are returned as Result values — no throwing.

import type { SessionRepository } from "./repository";
import type { Result } from "../shared/result";
import { ok, err } from "../shared/result";

export type CreateSessionDeps = {
  repo: SessionRepository;
  adminToken: string;
  baseUrl: string;
};

export type CreateSessionInput = {
  /** The Authorization bearer value extracted from the request. */
  providedToken: string;
};

export type CreateSessionOutput = {
  token: string;
  url: string;
};

export type CreateSessionError = "unauthorized";

export async function createSession(
  deps: CreateSessionDeps,
  input: CreateSessionInput,
): Promise<Result<CreateSessionOutput, CreateSessionError>> {
  if (input.providedToken !== deps.adminToken) {
    return err("unauthorized");
  }

  // URL-safe random token: strip hyphens from a UUID for a compact 32-char hex string.
  const token = crypto.randomUUID().replace(/-/g, "");

  await deps.repo.createSession(token);

  return ok({
    token,
    url: `${deps.baseUrl}/interview/${token}`,
  });
}
