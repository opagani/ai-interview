// Production Drizzle/D1 implementation of the SessionRepository port.

import { drizzle } from "drizzle-orm/d1";
import { eq, gt, and } from "drizzle-orm";
import * as schema from "./schema";
import type { D1Database } from "@cloudflare/workers-types";
import type {
  SessionRepository,
  Session,
  Turn,
  ScoreRow,
  SessionStatus,
  TurnRole,
} from "./repository";

// Drizzle infers column types from the schema. Timestamp columns with
// mode:"timestamp" return Date objects; text enum columns return strings.
// These helpers coerce Drizzle rows to the domain types without any `any`.

type DrizzleSession = typeof schema.sessions.$inferSelect;
type DrizzleTurn = typeof schema.turns.$inferSelect;
type DrizzleScore = typeof schema.scores.$inferSelect;

function toSession(row: DrizzleSession): Session {
  return {
    id: row.id,
    token: row.token,
    status: row.status as SessionStatus,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    startedAt:
      row.startedAt == null
        ? null
        : row.startedAt instanceof Date
          ? row.startedAt
          : new Date(row.startedAt),
    completedAt:
      row.completedAt == null
        ? null
        : row.completedAt instanceof Date
          ? row.completedAt
          : new Date(row.completedAt),
    currentTopic: row.currentTopic ?? null,
    currentQuestionIndex: row.currentQuestionIndex,
  };
}

function toTurn(row: DrizzleTurn): Turn {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role as TurnRole,
    content: row.content,
    topic: row.topic ?? null,
    questionId: row.questionId ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

function toScoreRow(row: DrizzleScore): ScoreRow {
  return {
    id: row.id,
    sessionId: row.sessionId,
    topic: row.topic,
    score: row.score,
    notes: row.notes,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

export function createD1SessionRepository(d1: D1Database): SessionRepository {
  const db = drizzle(d1, { schema });

  return {
    async createSession(token: string): Promise<Session> {
      const rows = await db
        .insert(schema.sessions)
        .values({ token, status: "pending", createdAt: new Date() })
        .returning();
      const row = rows[0];
      if (row === undefined) throw new Error("createSession: insert returned no rows");
      return toSession(row);
    },

    async findByToken(token: string): Promise<Session | null> {
      const rows = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .limit(1);
      const row = rows[0];
      return row !== undefined ? toSession(row) : null;
    },

    async updateStatus(
      token: string,
      status: SessionStatus,
      extra?: {
        startedAt?: Date;
        completedAt?: Date;
        currentTopic?: string;
        currentQuestionIndex?: number;
      },
    ): Promise<void> {
      const updates: Partial<typeof schema.sessions.$inferInsert> = { status };

      if (extra !== undefined) {
        if (extra.startedAt !== undefined) updates.startedAt = extra.startedAt;
        if (extra.completedAt !== undefined) updates.completedAt = extra.completedAt;
        if (extra.currentTopic !== undefined) updates.currentTopic = extra.currentTopic;
        if (extra.currentQuestionIndex !== undefined)
          updates.currentQuestionIndex = extra.currentQuestionIndex;
      }

      await db
        .update(schema.sessions)
        .set(updates)
        .where(eq(schema.sessions.token, token));
    },

    async appendTurn(
      sessionId: number,
      turn: {
        role: TurnRole;
        content: string;
        topic?: string;
        questionId?: string;
      },
    ): Promise<Turn> {
      const rows = await db
        .insert(schema.turns)
        .values({
          sessionId,
          role: turn.role,
          content: turn.content,
          topic: turn.topic ?? null,
          questionId: turn.questionId ?? null,
          createdAt: new Date(),
        })
        .returning();
      const row = rows[0];
      if (row === undefined) throw new Error("appendTurn: insert returned no rows");
      return toTurn(row);
    },

    async listTurns(token: string): Promise<Turn[]> {
      const session = await this.findByToken(token);
      if (session === null) return [];

      const rows = await db
        .select()
        .from(schema.turns)
        .where(eq(schema.turns.sessionId, session.id))
        .orderBy(schema.turns.id);

      return rows.map(toTurn);
    },

    async deleteTurnsAfter(sessionId: number, afterId: number): Promise<void> {
      await db
        .delete(schema.turns)
        .where(and(eq(schema.turns.sessionId, sessionId), gt(schema.turns.id, afterId)));
    },

    async insertScores(
      sessionId: number,
      scores: ReadonlyArray<{ topic: string; score: number; notes: string }>,
    ): Promise<void> {
      await Promise.all(
        scores.map((s) =>
          db.insert(schema.scores).values({
            sessionId,
            topic: s.topic,
            score: s.score,
            notes: s.notes,
            createdAt: new Date(),
          }),
        ),
      );
    },

    async listScores(token: string): Promise<ScoreRow[]> {
      const session = await this.findByToken(token);
      if (session === null) return [];

      const rows = await db
        .select()
        .from(schema.scores)
        .where(eq(schema.scores.sessionId, session.id));

      return rows.map(toScoreRow);
    },

    async listAll(): Promise<Session[]> {
      const rows = await db.select().from(schema.sessions);
      return rows.map(toSession);
    },
  };
}
