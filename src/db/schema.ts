import {
  integer,
  pgTable,
  varchar,
  timestamp,
  boolean,
  real
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  telegramId: varchar({ length: 255 }).notNull().primaryKey(),
  username: varchar({ length: 255 }).notNull(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  aiEnabled: boolean().notNull().default(false),
  customAiModel: varchar({ length: 255 }).notNull().default("deepseek-r1:1.5b"),
  aiTemperature: real().notNull().default(0.9),
  aiRequests: integer().notNull().default(0),
  aiCharacters: integer().notNull().default(0),
  languageCode: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
