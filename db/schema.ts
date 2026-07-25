import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  icon: text("icon").notNull(),
  status: text("status").notNull(),
  currentAmount: integer("current_amount").notNull().default(0),
  targetAmount: integer("target_amount").notNull(),
  estimate: text("estimate").notNull(),
  muted: integer("muted", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const goalRecords = sqliteTable("goal_records", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  amount: integer("amount").notNull(),
  note: text("note").notNull(),
  balance: integer("balance").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("goal_records_goal_date_idx").on(table.goalId, table.date)]);

export const assetAccounts = sqliteTable("asset_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quadrant: text("quadrant").notNull(),
  amount: integer("amount").notNull(),
  performance: text("performance").notNull(),
  icon: text("icon").notNull(),
  accent: text("accent").notNull(),
  path: text("path").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const assetTransactions = sqliteTable("asset_transactions", {
  id: text("id").primaryKey(),
  accountId: text("account_id").references(() => assetAccounts.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  amount: integer("amount").notNull(),
  detail: text("detail").notNull(),
  icon: text("icon").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("asset_transactions_date_idx").on(table.date)]);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
