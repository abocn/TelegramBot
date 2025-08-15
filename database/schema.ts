import {
  integer,
  pgTable,
  varchar,
  timestamp,
  boolean,
  real,
  index
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  telegramId: varchar({ length: 255 }).notNull().primaryKey(),
  username: varchar({ length: 255 }).notNull(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  aiEnabled: boolean().notNull().default(false),
  showThinking: boolean().notNull().default(false),
  customAiModel: varchar({ length: 255 }).notNull().default("deepseek-r1:1.5b"),
  customSystemPrompt: varchar({ length: 10000 }).notNull().default(""),
  aiTemperature: real().notNull().default(0.9),
  aiRequests: integer().notNull().default(0),
  aiCharacters: integer().notNull().default(0),
  disabledCommands: varchar({ length: 255 }).array().notNull().default([]),
  disabledAdminCommands: varchar({ length: 255 }).array().notNull().default([]),
  isAdmin: boolean().notNull().default(false),
  languageCode: varchar({ length: 255 }).notNull(),
  timezone: varchar({ length: 255 }).notNull().default("UTC"),
  aiTimeoutUntil: timestamp(),
  aiMaxExecutionTime: integer().default(0),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const twoFactorTable = pgTable("two_factor", {
  userId: varchar({ length: 255 }).notNull().references(() => usersTable.telegramId).primaryKey(),
  currentCode: varchar({ length: 255 }).notNull(),
  codeExpiresAt: timestamp().notNull(),
  codeAttempts: integer().notNull().default(0),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("idx_two_factor_user_id").on(table.userId),
  index("idx_two_factor_code_expires_at").on(table.codeExpiresAt),
]);

export const sessionsTable = pgTable("sessions", {
  id: varchar({ length: 255 }).notNull().primaryKey(),
  userId: varchar({ length: 255 }).notNull().references(() => usersTable.telegramId),
  sessionToken: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("idx_sessions_user_id").on(table.userId),
  index("idx_sessions_expires_at").on(table.expiresAt),
]);

export const wikiCacheTable = pgTable("wiki_cache", {
  id: varchar({ length: 255 }).notNull().primaryKey(),
  query: varchar({ length: 500 }).notNull(),
  content: varchar().notNull(),
  url: varchar({ length: 1000 }).notNull(),
  cacheAge: integer().notNull().default(7200000),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("idx_wiki_cache_query").on(table.query),
  index("idx_wiki_cache_updated_at").on(table.updatedAt),
]);

export const wikiPaginationTable = pgTable("wiki_pagination", {
  id: varchar({ length: 255 }).notNull().primaryKey(),
  userId: varchar({ length: 255 }).notNull(),
  pages: varchar().array().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("idx_wiki_pagination_expires_at").on(table.expiresAt),
]);

export const commandUsageTable = pgTable("command_usage", {
  id: varchar({ length: 255 }).notNull().primaryKey(),
  commandName: varchar({ length: 255 }).notNull(),
  chatType: varchar({ length: 50 }).notNull(),
  isSuccess: boolean().notNull().default(true),
  errorMessage: varchar({ length: 1000 }),
  executionTime: integer(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("idx_command_usage_command_name").on(table.commandName),
  index("idx_command_usage_created_at").on(table.createdAt),
]);
