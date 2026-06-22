import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  status: text("status", {
    enum: ["pending", "active", "awaiting_scoring", "complete"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  currentTopic: text("current_topic"),
  currentQuestionIndex: integer("current_question_index")
    .notNull()
    .default(0),
});

export const turns = sqliteTable("turns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  topic: text("topic"),
  questionId: text("question_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  score: integer("score").notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
