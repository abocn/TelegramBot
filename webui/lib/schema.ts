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
  timezone: varchar({ length: 255 }).notNull().default("UTC"),
  languageCode: varchar({ length: 255 }).notNull(),
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
