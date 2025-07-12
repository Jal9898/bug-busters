import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSkillSchema, insertSwapRequestSchema, insertRatingSchema, insertPlatformMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithSkills(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const search = req.query.search as string;
      const availability = req.query.availability as string;

      if (search) {
        const users = await storage.searchUsers(search, { availability });
        res.json({ users, total: users.length });
      } else {
        const result = await storage.getPublicUsers(page, limit);
        res.json(result);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUserWithSkills(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, location, availability, isPublic } = req.body;
      
      const user = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        location,
        availability,
        isPublic,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile photo upload endpoint
  app.post('/api/users/profile-photo', isAuthenticated, upload.single('profilePhoto'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Delete old profile photo if it exists
      const currentUser = await storage.getUser(userId);
      if (currentUser?.customProfileImage) {
        const oldImagePath = path.join(process.cwd(), 'uploads', path.basename(currentUser.customProfileImage));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update user with new profile photo URL
      const profileImageUrl = `/uploads/${req.file.filename}`;
      const user = await storage.updateUserProfile(userId, {
        customProfileImage: profileImageUrl,
      });
      
      res.json({ 
        message: "Profile photo updated successfully", 
        profileImageUrl,
        user 
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Delete profile photo endpoint
  app.delete('/api/users/profile-photo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.customProfileImage) {
        // Delete the file
        const imagePath = path.join(process.cwd(), 'uploads', path.basename(currentUser.customProfileImage));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        
        // Update user to remove custom profile image
        const user = await storage.updateUserProfile(userId, {
          customProfileImage: null,
        });
        
        res.json({ message: "Profile photo deleted successfully", user });
      } else {
        res.status(404).json({ message: "No custom profile photo found" });
      }
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      res.status(500).json({ message: "Failed to delete profile photo" });
    }
  });

  // Skills routes
  app.get('/api/skills', async (req, res) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const skillData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(skillData);
      res.json(skill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.post('/api/users/skills-offered', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { skillId } = req.body;
      await storage.addUserSkillOffered(userId, skillId);
      res.json({ message: "Skill added" });
    } catch (error) {
      console.error("Error adding skill:", error);
      res.status(500).json({ message: "Failed to add skill" });
    }
  });

  app.post('/api/users/skills-wanted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { skillId } = req.body;
      await storage.addUserSkillWanted(userId, skillId);
      res.json({ message: "Skill added" });
    } catch (error) {
      console.error("Error adding skill:", error);
      res.status(500).json({ message: "Failed to add skill" });
    }
  });

  app.delete('/api/users/skills-offered/:skillId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skillId = parseInt(req.params.skillId);
      await storage.removeUserSkillOffered(userId, skillId);
      res.json({ message: "Skill removed" });
    } catch (error) {
      console.error("Error removing skill:", error);
      res.status(500).json({ message: "Failed to remove skill" });
    }
  });

  app.delete('/api/users/skills-wanted/:skillId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skillId = parseInt(req.params.skillId);
      await storage.removeUserSkillWanted(userId, skillId);
      res.json({ message: "Skill removed" });
    } catch (error) {
      console.error("Error removing skill:", error);
      res.status(500).json({ message: "Failed to remove skill" });
    }
  });

  // Swap request routes
  app.post('/api/swap-requests', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const requestData = insertSwapRequestSchema.parse({
        ...req.body,
        requesterId,
      });
      
      const swapRequest = await storage.createSwapRequest(requestData);
      res.json(swapRequest);
    } catch (error) {
      console.error("Error creating swap request:", error);
      res.status(500).json({ message: "Failed to create swap request" });
    }
  });

  app.get('/api/swap-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getSwapRequestsForUser(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.put('/api/swap-requests/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      const request = await storage.updateSwapRequestStatus(requestId, status);
      res.json(request);
    } catch (error) {
      console.error("Error updating swap request:", error);
      res.status(500).json({ message: "Failed to update swap request" });
    }
  });

  app.delete('/api/swap-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      await storage.deleteSwapRequest(requestId, userId);
      res.json({ message: "Swap request deleted" });
    } catch (error) {
      console.error("Error deleting swap request:", error);
      res.status(500).json({ message: "Failed to delete swap request" });
    }
  });

  // Rating routes
  app.post('/api/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const raterId = req.user.claims.sub;
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        raterId,
      });
      
      const rating = await storage.createRating(ratingData);
      res.json(rating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  app.get('/api/users/:id/ratings', async (req, res) => {
    try {
      const userId = req.params.id;
      const ratings = await storage.getUserRatings(userId);
      const average = await storage.getAverageRating(userId);
      res.json({ ratings, average });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/ban-user', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (!admin?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { userId, reason } = req.body;
      await storage.banUser(userId, adminId, reason);
      res.json({ message: "User banned" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.post('/api/admin/platform-message', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (!admin?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messageData = insertPlatformMessageSchema.parse({
        ...req.body,
        createdBy: adminId,
      });
      
      const message = await storage.createPlatformMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating platform message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get('/api/admin/swap-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const requests = await storage.getAllSwapRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching admin swap requests:", error);
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  // Platform messages route
  app.get('/api/platform-messages', async (req, res) => {
    try {
      const messages = await storage.getActivePlatformMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching platform messages:", error);
      res.status(500).json({ message: "Failed to fetch platform messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
