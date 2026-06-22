// Domain types and SessionRepository port.
// Pure types/interfaces — no implementation here.

export type SessionStatus = "pending" | "active" | "awaiting_scoring" | "complete";

export type Session = {
  id: number;
  token: string;
  status: SessionStatus;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  currentTopic: string | null;
  currentQuestionIndex: number;
};

export type TurnRole = "user" | "assistant" | "system";

export type Turn = {
  id: number;
  sessionId: number;
  role: TurnRole;
  content: string;
  topic: string | null;
  questionId: string | null;
  createdAt: Date;
};

export type ScoreRow = {
  id: number;
  sessionId: number;
  topic: string;
  score: number;
  notes: string;
  createdAt: Date;
};

export interface SessionRepository {
  createSession(token: string): Promise<Session>;
  findByToken(token: string): Promise<Session | null>;
  updateStatus(
    token: string,
    status: SessionStatus,
    extra?: {
      startedAt?: Date;
      completedAt?: Date;
      currentTopic?: string;
      currentQuestionIndex?: number;
    },
  ): Promise<void>;
  appendTurn(
    sessionId: number,
    turn: {
      role: TurnRole;
      content: string;
      topic?: string;
      questionId?: string;
    },
  ): Promise<Turn>;
  listTurns(token: string): Promise<Turn[]>;
  deleteTurnsAfter(sessionId: number, afterId: number): Promise<void>;
  insertScores(
    sessionId: number,
    scores: ReadonlyArray<{ topic: string; score: number; notes: string }>,
  ): Promise<void>;
  listScores(token: string): Promise<ScoreRow[]>;
  listAll(): Promise<Session[]>;
}
