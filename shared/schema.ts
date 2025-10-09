import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My Board"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  column: text("column").notNull().default("ideas"), // "ideas" | "in-progress" | "completed"
  clusterId: integer("cluster_id"),
  clusterName: text("cluster_name"),
  clusterColor: text("cluster_color"),
  position: integer("position").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const suggestions = sqliteTable("suggestions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isUsed: text("is_used").notNull().default("false"), // "true" | "false"
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const boardShares = sqliteTable("board_shares", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("viewer"), // "owner" | "editor" | "viewer"
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Inbox-style shared items (owner can send an idea to a recipient)
export const sharedItems = sqliteTable("shared_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderUserId: text("sender_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientUserId: text("recipient_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceBoardId: text("source_board_id").notNull().references(() => boards.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "accepted" | "dismissed"
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const ideaMoods = sqliteTable("idea_moods", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ideaId: text("idea_id").notNull().references(() => ideas.id, { onDelete: "cascade" }),
  mood: text("mood").notNull(), // "positive" | "neutral" | "negative"
  confidence: integer("confidence").notNull().default(0), // 0-100 confidence score
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBoardSchema = createInsertSchema(boards).pick({
  name: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).pick({
  title: true,
  content: true,
  column: true,
  clusterId: true,
  clusterName: true,
  clusterColor: true,
  position: true,
});

export const insertSuggestionSchema = createInsertSchema(suggestions).pick({
  text: true,
});

export const insertBoardShareSchema = createInsertSchema(boardShares).pick({
  boardId: true,
  userId: true,
  role: true,
});

export const insertIdeaMoodSchema = createInsertSchema(ideaMoods).pick({
  ideaId: true,
  mood: true,
  confidence: true,
});

export const insertSharedItemSchema = createInsertSchema(sharedItems).pick({
  senderUserId: true,
  recipientUserId: true,
  sourceBoardId: true,
  title: true,
  content: true,
  status: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Board = typeof boards.$inferSelect;
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Idea = typeof ideas.$inferSelect;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type BoardShare = typeof boardShares.$inferSelect;
export type InsertBoardShare = z.infer<typeof insertBoardShareSchema>;
export type IdeaMood = typeof ideaMoods.$inferSelect;
export type InsertIdeaMood = z.infer<typeof insertIdeaMoodSchema>;
export type SharedItem = typeof sharedItems.$inferSelect;
export type InsertSharedItem = z.infer<typeof insertSharedItemSchema>;
