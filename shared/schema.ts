import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  organization: text("organization"),
  department: text("department"),
  jobPosition: text("job_position"),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  query: text("query").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  collection: text("collection").notNull(),
  folder: text("folder"),
  fileName: text("file_name").notNull(),
  content: text("content").notNull(),
});

export const userSearchResults = pgTable("user_search_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  searchHistoryId: integer("search_history_id").references(() => searchHistory.id),
  resultId: integer("result_id").references(() => searchResults.id),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  token: text("token").notNull(),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  lastActive: timestamp("last_active").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  theme: text("theme").default("dark"),
  language: text("language").default("English"),
  timezone: text("timezone"),
  autoLogoutTime: integer("auto_logout_time").default(30), // in minutes
  mfaEnabled: boolean("mfa_enabled").default(false),
  showIndexedFiles: boolean("show_indexed_files").default(true),
  showRecentSearches: boolean("show_recent_searches").default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  organization: true,
  department: true,
  jobPosition: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  userId: true,
  query: true,
});

export const insertSearchResultSchema = createInsertSchema(searchResults).pick({
  collection: true,
  folder: true,
  fileName: true,
  content: true,
});

export const insertUserSearchResultSchema = createInsertSchema(userSearchResults).pick({
  userId: true,
  searchHistoryId: true,
  resultId: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  deviceInfo: true,
  ipAddress: true,
  expiresAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  theme: true,
  language: true,
  timezone: true,
  autoLogoutTime: true,
  mfaEnabled: true,
  showIndexedFiles: true,
  showRecentSearches: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;

export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type SearchResult = typeof searchResults.$inferSelect;

export type InsertUserSearchResult = z.infer<typeof insertUserSearchResultSchema>;
export type UserSearchResult = typeof userSearchResults.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
