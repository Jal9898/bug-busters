import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  customProfileImage: varchar("custom_profile_image"),
  location: varchar("location"),
  availability: varchar("availability").default("weekends"),
  isPublic: boolean("is_public").default(true),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skills table
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User skills - what skills they offer
export const userSkillsOffered = pgTable("user_skills_offered", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  skillId: integer("skill_id").references(() => skills.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User skills - what skills they want
export const userSkillsWanted = pgTable("user_skills_wanted", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  skillId: integer("skill_id").references(() => skills.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Swap requests
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  offeredSkillId: integer("offered_skill_id").references(() => skills.id).notNull(),
  wantedSkillId: integer("wanted_skill_id").references(() => skills.id).notNull(),
  status: varchar("status").default("pending"), // pending, accepted, rejected, completed
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ratings and feedback
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  swapRequestId: integer("swap_request_id").references(() => swapRequests.id).notNull(),
  raterId: varchar("rater_id").references(() => users.id).notNull(),
  ratedId: varchar("rated_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin actions log
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // ban_user, approve_skill, reject_skill, send_message
  targetId: varchar("target_id"), // user_id, skill_id, etc.
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform messages
export const platformMessages = pgTable("platform_messages", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  skillsOffered: many(userSkillsOffered),
  skillsWanted: many(userSkillsWanted),
  sentRequests: many(swapRequests, { relationName: "requester" }),
  receivedRequests: many(swapRequests, { relationName: "recipient" }),
  givenRatings: many(ratings, { relationName: "rater" }),
  receivedRatings: many(ratings, { relationName: "rated" }),
  adminActions: many(adminActions),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  offeredBy: many(userSkillsOffered),
  wantedBy: many(userSkillsWanted),
}));

export const userSkillsOfferedRelations = relations(userSkillsOffered, ({ one }) => ({
  user: one(users, { fields: [userSkillsOffered.userId], references: [users.id] }),
  skill: one(skills, { fields: [userSkillsOffered.skillId], references: [skills.id] }),
}));

export const userSkillsWantedRelations = relations(userSkillsWanted, ({ one }) => ({
  user: one(users, { fields: [userSkillsWanted.userId], references: [users.id] }),
  skill: one(skills, { fields: [userSkillsWanted.skillId], references: [skills.id] }),
}));

export const swapRequestsRelations = relations(swapRequests, ({ one, many }) => ({
  requester: one(users, { fields: [swapRequests.requesterId], references: [users.id], relationName: "requester" }),
  recipient: one(users, { fields: [swapRequests.recipientId], references: [users.id], relationName: "recipient" }),
  offeredSkill: one(skills, { fields: [swapRequests.offeredSkillId], references: [skills.id] }),
  wantedSkill: one(skills, { fields: [swapRequests.wantedSkillId], references: [skills.id] }),
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  swapRequest: one(swapRequests, { fields: [ratings.swapRequestId], references: [swapRequests.id] }),
  rater: one(users, { fields: [ratings.raterId], references: [users.id], relationName: "rater" }),
  rated: one(users, { fields: [ratings.ratedId], references: [users.id], relationName: "rated" }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
});

export const insertSwapRequestSchema = createInsertSchema(swapRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformMessageSchema = createInsertSchema(platformMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type SwapRequest = typeof swapRequests.$inferSelect;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type PlatformMessage = typeof platformMessages.$inferSelect;
export type InsertPlatformMessage = z.infer<typeof insertPlatformMessageSchema>;
