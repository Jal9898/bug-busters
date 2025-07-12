import {
  users,
  skills,
  userSkillsOffered,
  userSkillsWanted,
  swapRequests,
  ratings,
  adminActions,
  platformMessages,
  type User,
  type UpsertUser,
  type Skill,
  type InsertSkill,
  type SwapRequest,
  type InsertSwapRequest,
  type Rating,
  type InsertRating,
  type InsertPlatformMessage,
  type PlatformMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User profile operations
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  getUserWithSkills(id: string): Promise<any>;
  searchUsers(query: string, filters?: { availability?: string }): Promise<any[]>;
  getPublicUsers(page?: number, limit?: number): Promise<{ users: any[], total: number }>;
  
  // Skills operations
  getSkills(): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  getUserSkillsOffered(userId: string): Promise<any[]>;
  getUserSkillsWanted(userId: string): Promise<any[]>;
  addUserSkillOffered(userId: string, skillId: number): Promise<void>;
  addUserSkillWanted(userId: string, skillId: number): Promise<void>;
  removeUserSkillOffered(userId: string, skillId: number): Promise<void>;
  removeUserSkillWanted(userId: string, skillId: number): Promise<void>;
  
  // Swap request operations
  createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest>;
  getSwapRequestsForUser(userId: string): Promise<any[]>;
  getSwapRequestById(id: number): Promise<any>;
  updateSwapRequestStatus(id: number, status: string): Promise<SwapRequest>;
  deleteSwapRequest(id: number, userId: string): Promise<void>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getUserRatings(userId: string): Promise<any[]>;
  getAverageRating(userId: string): Promise<number>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  banUser(userId: string, adminId: string, reason: string): Promise<void>;
  unbanUser(userId: string, adminId: string): Promise<void>;
  getPendingSkills(): Promise<Skill[]>;
  approveSkill(skillId: number, adminId: string): Promise<void>;
  rejectSkill(skillId: number, adminId: string, reason: string): Promise<void>;
  getAllSwapRequests(): Promise<any[]>;
  createPlatformMessage(message: InsertPlatformMessage): Promise<PlatformMessage>;
  getActivePlatformMessages(): Promise<PlatformMessage[]>;
  logAdminAction(adminId: string, action: string, targetId: string, reason?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User profile operations
  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserWithSkills(id: string): Promise<any> {
    const user = await this.getUser(id);
    if (!user) return null;

    const skillsOffered = await db
      .select({
        id: skills.id,
        name: skills.name,
        category: skills.category,
      })
      .from(userSkillsOffered)
      .leftJoin(skills, eq(userSkillsOffered.skillId, skills.id))
      .where(eq(userSkillsOffered.userId, id));

    const skillsWanted = await db
      .select({
        id: skills.id,
        name: skills.name,
        category: skills.category,
      })
      .from(userSkillsWanted)
      .leftJoin(skills, eq(userSkillsWanted.skillId, skills.id))
      .where(eq(userSkillsWanted.userId, id));

    const averageRating = await this.getAverageRating(id);

    return {
      ...user,
      skillsOffered,
      skillsWanted,
      averageRating,
    };
  }

  async searchUsers(query: string, filters?: { availability?: string }): Promise<any[]> {
    let whereClause = and(
      eq(users.isPublic, true),
      or(
        ilike(users.firstName, `%${query}%`),
        ilike(users.lastName, `%${query}%`),
        ilike(users.location, `%${query}%`)
      )
    );

    if (filters?.availability) {
      whereClause = and(whereClause, eq(users.availability, filters.availability));
    }

    const usersFound = await db.select().from(users).where(whereClause);
    
    // Get skills for each user
    const usersWithSkills = await Promise.all(
      usersFound.map(async (user) => {
        const skillsOffered = await db
          .select({ id: skills.id, name: skills.name })
          .from(userSkillsOffered)
          .leftJoin(skills, eq(userSkillsOffered.skillId, skills.id))
          .where(eq(userSkillsOffered.userId, user.id));

        const skillsWanted = await db
          .select({ id: skills.id, name: skills.name })
          .from(userSkillsWanted)
          .leftJoin(skills, eq(userSkillsWanted.skillId, skills.id))
          .where(eq(userSkillsWanted.userId, user.id));

        const averageRating = await this.getAverageRating(user.id);

        return {
          ...user,
          skillsOffered,
          skillsWanted,
          averageRating,
        };
      })
    );

    return usersWithSkills;
  }

  async getPublicUsers(page = 1, limit = 9): Promise<{ users: any[], total: number }> {
    const offset = (page - 1) * limit;
    
    const usersFound = await db
      .select()
      .from(users)
      .where(eq(users.isPublic, true))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isPublic, true));

    const usersWithSkills = await Promise.all(
      usersFound.map(async (user) => {
        const skillsOffered = await db
          .select({ id: skills.id, name: skills.name })
          .from(userSkillsOffered)
          .leftJoin(skills, eq(userSkillsOffered.skillId, skills.id))
          .where(eq(userSkillsOffered.userId, user.id));

        const skillsWanted = await db
          .select({ id: skills.id, name: skills.name })
          .from(userSkillsWanted)
          .leftJoin(skills, eq(userSkillsWanted.skillId, skills.id))
          .where(eq(userSkillsWanted.userId, user.id));

        const averageRating = await this.getAverageRating(user.id);

        return {
          ...user,
          skillsOffered,
          skillsWanted,
          averageRating,
        };
      })
    );

    return { users: usersWithSkills, total: count };
  }

  // Skills operations
  async getSkills(): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(asc(skills.name));
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async getUserSkillsOffered(userId: string): Promise<any[]> {
    return await db
      .select({ id: skills.id, name: skills.name, category: skills.category })
      .from(userSkillsOffered)
      .leftJoin(skills, eq(userSkillsOffered.skillId, skills.id))
      .where(eq(userSkillsOffered.userId, userId));
  }

  async getUserSkillsWanted(userId: string): Promise<any[]> {
    return await db
      .select({ id: skills.id, name: skills.name, category: skills.category })
      .from(userSkillsWanted)
      .leftJoin(skills, eq(userSkillsWanted.skillId, skills.id))
      .where(eq(userSkillsWanted.userId, userId));
  }

  async addUserSkillOffered(userId: string, skillId: number): Promise<void> {
    await db.insert(userSkillsOffered).values({ userId, skillId });
  }

  async addUserSkillWanted(userId: string, skillId: number): Promise<void> {
    await db.insert(userSkillsWanted).values({ userId, skillId });
  }

  async removeUserSkillOffered(userId: string, skillId: number): Promise<void> {
    await db
      .delete(userSkillsOffered)
      .where(and(eq(userSkillsOffered.userId, userId), eq(userSkillsOffered.skillId, skillId)));
  }

  async removeUserSkillWanted(userId: string, skillId: number): Promise<void> {
    await db
      .delete(userSkillsWanted)
      .where(and(eq(userSkillsWanted.userId, userId), eq(userSkillsWanted.skillId, skillId)));
  }

  // Swap request operations
  async createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest> {
    const [newRequest] = await db.insert(swapRequests).values(request).returning();
    return newRequest;
  }

  async getSwapRequestsForUser(userId: string): Promise<any[]> {
    const requests = await db
      .select({
        id: swapRequests.id,
        status: swapRequests.status,
        message: swapRequests.message,
        createdAt: swapRequests.createdAt,
        requester: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        recipient: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        offeredSkill: {
          id: skills.id,
          name: skills.name,
        },
        wantedSkill: {
          id: skills.id,
          name: skills.name,
        },
      })
      .from(swapRequests)
      .leftJoin(users, eq(swapRequests.requesterId, users.id))
      .leftJoin(skills, eq(swapRequests.offeredSkillId, skills.id))
      .where(or(eq(swapRequests.requesterId, userId), eq(swapRequests.recipientId, userId)))
      .orderBy(desc(swapRequests.createdAt));

    return requests;
  }

  async getSwapRequestById(id: number): Promise<any> {
    const [request] = await db
      .select()
      .from(swapRequests)
      .where(eq(swapRequests.id, id));
    return request;
  }

  async updateSwapRequestStatus(id: number, status: string): Promise<SwapRequest> {
    const [request] = await db
      .update(swapRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(swapRequests.id, id))
      .returning();
    return request;
  }

  async deleteSwapRequest(id: number, userId: string): Promise<void> {
    await db
      .delete(swapRequests)
      .where(and(eq(swapRequests.id, id), eq(swapRequests.requesterId, userId)));
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getUserRatings(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getAverageRating(userId: string): Promise<number> {
    const [result] = await db
      .select({ avg: sql<number>`avg(${ratings.rating})` })
      .from(ratings)
      .where(eq(ratings.ratedId, userId));
    
    return result?.avg ? Math.round(result.avg * 10) / 10 : 0;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async banUser(userId: string, adminId: string, reason: string): Promise<void> {
    await db.update(users).set({ isPublic: false }).where(eq(users.id, userId));
    await this.logAdminAction(adminId, "ban_user", userId, reason);
  }

  async unbanUser(userId: string, adminId: string): Promise<void> {
    await db.update(users).set({ isPublic: true }).where(eq(users.id, userId));
    await this.logAdminAction(adminId, "unban_user", userId);
  }

  async getPendingSkills(): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(desc(skills.createdAt));
  }

  async approveSkill(skillId: number, adminId: string): Promise<void> {
    await this.logAdminAction(adminId, "approve_skill", skillId.toString());
  }

  async rejectSkill(skillId: number, adminId: string, reason: string): Promise<void> {
    await db.delete(skills).where(eq(skills.id, skillId));
    await this.logAdminAction(adminId, "reject_skill", skillId.toString(), reason);
  }

  async getAllSwapRequests(): Promise<any[]> {
    return await db
      .select()
      .from(swapRequests)
      .orderBy(desc(swapRequests.createdAt));
  }

  async createPlatformMessage(message: InsertPlatformMessage): Promise<PlatformMessage> {
    const [newMessage] = await db.insert(platformMessages).values(message).returning();
    return newMessage;
  }

  async getActivePlatformMessages(): Promise<PlatformMessage[]> {
    return await db
      .select()
      .from(platformMessages)
      .where(eq(platformMessages.isActive, true))
      .orderBy(desc(platformMessages.createdAt));
  }

  async logAdminAction(adminId: string, action: string, targetId: string, reason?: string): Promise<void> {
    await db.insert(adminActions).values({
      adminId,
      action,
      targetId,
      reason,
    });
  }
}

export const storage = new DatabaseStorage();
