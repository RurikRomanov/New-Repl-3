import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique().notNull(),
  username: text("username").notNull(),
  energy: integer("energy").default(100).notNull(),
  totalRewards: integer("total_rewards").default(0).notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull()
});

export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull(),
  nonce: text("nonce"),
  difficulty: integer("difficulty").notNull(),
  status: text("status").default("mining").notNull(), // mining, completed
  minedBy: text("mined_by").references(() => users.telegramId),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id").references(() => blocks.id),
  userId: text("user_id").references(() => users.telegramId),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // "miner" or "participant"
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
