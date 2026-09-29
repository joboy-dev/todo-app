import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  priority: text("priority").$type<Priority>().notNull().default("medium"),
  category: text("category"),
  dueDate: text("due_date"), // ISO date string, e.g. "2026-10-01"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Todo = typeof todos.$inferSelect;
