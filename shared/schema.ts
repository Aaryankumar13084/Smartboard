import { pgTable, text, serial, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: serial("owner_id").notNull(),
  data: jsonb("data").notNull().default({}),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const boardSessions = pgTable("board_sessions", {
  id: serial("id").primaryKey(),
  boardId: serial("board_id").notNull(),
  userId: serial("user_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBoardSchema = createInsertSchema(boards).pick({
  name: true,
  ownerId: true,
  data: true,
  isPublic: true,
});

export const insertBoardSessionSchema = createInsertSchema(boardSessions).pick({
  boardId: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boards.$inferSelect;

export type InsertBoardSession = z.infer<typeof insertBoardSessionSchema>;
export type BoardSession = typeof boardSessions.$inferSelect;

// Drawing data types
export const DrawingEventSchema = z.object({
  type: z.enum(['draw', 'erase', 'shape', 'text', 'clear']),
  tool: z.string(),
  points: z.array(z.object({
    x: z.number(),
    y: z.number(),
  })),
  color: z.string(),
  size: z.number(),
  opacity: z.number(),
  layerId: z.string(),
  userId: z.number(),
  timestamp: z.number(),
});

export type DrawingEvent = z.infer<typeof DrawingEventSchema>;
