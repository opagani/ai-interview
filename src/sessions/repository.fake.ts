// Test-only in-memory implementation of the SessionRepository port.
// No persistence. Auto-increment IDs starting at 1.
// Not for production use.

import type {
  Session,
  SessionRepository,
  SessionStatus,
  Turn,
  TurnRole,
  ScoreRow,
} from "./repository";

export function createFakeSessionRepository(): SessionRepository & {
  listAll(): Promise<Session[]>;
} {
  const sessions = new Map<string, Session>();
  const turns = new Map<number, Turn[]>(); // keyed by sessionId
  const scores = new Map<number, ScoreRow[]>(); // keyed by sessionId

  let nextSessionId = 1;
  let nextTurnId = 1;
  let nextScoreId = 1;

  function requireSession(token: string): Session | null {
    return sessions.get(token) ?? null;
  }

  return {
    async createSession(token: string): Promise<Session> {
      const session: Session = {
        id: nextSessionId++,
        token,
        status: "pending",
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        currentTopic: null,
        currentQuestionIndex: 0,
      };
      sessions.set(token, session);
      return session;
    },

    async findByToken(token: string): Promise<Session | null> {
      return requireSession(token);
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
      const session = requireSession(token);
      if (session === null) return;

      session.status = status;
      if (extra?.startedAt !== undefined) session.startedAt = extra.startedAt;
      if (extra?.completedAt !== undefined) session.completedAt = extra.completedAt;
      if (extra?.currentTopic !== undefined) session.currentTopic = extra.currentTopic;
      if (extra?.currentQuestionIndex !== undefined)
        session.currentQuestionIndex = extra.currentQuestionIndex;
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
      const row: Turn = {
        id: nextTurnId++,
        sessionId,
        role: turn.role,
        content: turn.content,
        topic: turn.topic ?? null,
        questionId: turn.questionId ?? null,
        createdAt: new Date(),
      };
      const existing = turns.get(sessionId) ?? [];
      existing.push(row);
      turns.set(sessionId, existing);
      return row;
    },

    async listTurns(token: string): Promise<Turn[]> {
      const session = requireSession(token);
      if (session === null) return [];
      const rows = turns.get(session.id) ?? [];
      return [...rows].sort((a, b) => a.id - b.id);
    },

    async deleteTurnsAfter(sessionId: number, afterId: number): Promise<void> {
      const existing = turns.get(sessionId) ?? [];
      turns.set(
        sessionId,
        existing.filter((t) => t.id <= afterId),
      );
    },

    async insertScores(
      sessionId: number,
      scoreEntries: ReadonlyArray<{ topic: string; score: number; notes: string }>,
    ): Promise<void> {
      const existing = scores.get(sessionId) ?? [];
      for (const entry of scoreEntries) {
        const row: ScoreRow = {
          id: nextScoreId++,
          sessionId,
          topic: entry.topic,
          score: entry.score,
          notes: entry.notes,
          createdAt: new Date(),
        };
        existing.push(row);
      }
      scores.set(sessionId, existing);
    },

    async listScores(token: string): Promise<ScoreRow[]> {
      const session = requireSession(token);
      if (session === null) return [];
      return scores.get(session.id) ?? [];
    },

    async listAll(): Promise<Session[]> {
      return Array.from(sessions.values());
    },
  };
}
