import express from "express";
import { Request, Response, NextFunction } from "express"
import { z } from "zod";
import { prisma } from "../../db/client";
import { authenticateUser } from "../../middleware/auth";

const router = express.Router();

// Middleware to authenticate all routes
router.use((req, res, next) => {
  authenticateUser(req, res, next).catch(next);
});

// Helper function for async error handling
const asyncHandler =
  (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    fn(req, res, next).catch(next);

// Zod Schemas for validation
const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(50),
  phone: z.string().optional(),
  address1: z.string().min(1, "Address is required").max(100),
  address2: z.string().max(100).optional(),
  city: z.string().min(1, "City is required").max(50),
  state: z.string().min(2, "State is required").max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Zip code must be 5 or 9 digits"),
  bio: z.string().max(500).optional(),
});

const skillsSchema = z.object({
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  yearsExperience: z.number().min(0),
  experienceLevel: z.number().min(1).max(4),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        issueDate: z.string().optional(),
        expiryDate: z.string().optional(),
      })
    )
    .optional(),
});

const preferencesSchema = z.object({
  causes: z.array(z.string()).min(1, "At least one cause is required"),
  preferredDistance: z.string(),
  frequency: z.string(),
  remoteOpportunities: z.boolean(),
  communicationPreference: z.string(),
  additionalPreferences: z.string().max(500).optional(),
});

const availabilitySchema = z.object({
  availableDays: z.array(z.string()).min(1, "At least one day is required"),
  availableTimeSlots: z.array(z.string()).min(1, "At least one time slot is required"),
  specificDates: z.array(z.string()).optional(),
  blackoutDates: z.array(z.string()).optional(),
  minimumNoticePeriod: z.string(),
  flexibleSchedule: z.boolean(),
});

const accountSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  emailFrequency: z.string(),
  smsNotifications: z.boolean(),
  profileVisibility: z.boolean(),
});

// GET User Profile
router.get(
  "/:userId",
  asyncHandler(async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && !req.user.isAdmin) {
        res.status(403).json({ error: "Unauthorized access to user profile" });
        return;
      }

      // Fetch user including profile & availability correctly
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true, // ✅ Corrected: availability is not in UserProfile
          availability: true, // ✅ Included directly from User model
        },
      });

      if (!user) {
        res.status(404).json({ error: "User profile not found" });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  })
);


// PUT: Update Personal Information
router.put(
  "/:userId/personal-info",
  asyncHandler(async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && !req.user.isAdmin) {
        res.status(403).json({ error: "Unauthorized access to update user profile" });
        return; // ✅ Ensure function stops execution
      }

      const validatedData = personalInfoSchema.parse(req.body);

      const updatedProfile = await prisma.userProfile.upsert({
        where: { userId },
        update: validatedData,
        create: { userId, ...validatedData },
      });

      res.status(200).json(updatedProfile);
    } catch (error) {
      next(error); // ✅ Pass errors to Express error handler
    }
  })
);

// PUT: Update Skills
router.put(
  "/:userId/skills",
  asyncHandler(async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && !req.user.isAdmin) {
        res.status(403).json({ error: "Unauthorized access to update user skills" });
        return; // ✅ Stop execution after sending response
      }

      const validatedData = skillsSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        await tx.userProfile.upsert({
          where: { userId },
          update: { yearsExperience: validatedData.yearsExperience, experienceLevel: validatedData.experienceLevel },
          create: { 
            userId, 
            yearsExperience: validatedData.yearsExperience, 
            experienceLevel: validatedData.experienceLevel,
            fullName: "", // Provide default or required values
            address1: "",
            city: "",
            state: "",
            zip: ""
          },
        });

        await tx.userSkill.deleteMany({ where: { userId } });

        await Promise.all(
          validatedData.skills.map((skill) => tx.userSkill.create({ data: { userId, name: skill } }))
        );

        if (validatedData.certifications) {
          await tx.userCertification.deleteMany({ where: { userId } });

          await Promise.all(
            validatedData.certifications.map((cert) =>
              tx.userCertification.create({
                data: {
                  userId,
                  name: cert.name,
                  issuer: cert.issuer,
                  issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
                  expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
                },
              })
            )
          );
        }
      });

      res.status(200).json({ message: "Skills updated successfully" });
    } catch (error) {
      next(error); // ✅ Pass errors to Express error handler
    }
  })
);

// PUT: Update Availability
router.put(
  "/:userId/availability",
  asyncHandler(async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && !req.user.isAdmin) {
        res.status(403).json({ error: "Unauthorized access to update user availability" });
        return; // ✅ Stop execution after sending response
      }

      const validatedData = availabilitySchema.parse(req.body);

      const updatedAvailability = await prisma.userAvailability.upsert({
        where: { userId },
        update: validatedData,
        create: { userId, ...validatedData },
      });

      res.status(200).json(updatedAvailability);
    } catch (error) {
      next(error); // ✅ Pass errors to Express error handler
    }
  })
);


// PUT: Update Account Settings
router.put(
  "/:userId/account-settings",
  asyncHandler(async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && !req.user.isAdmin) {
        res.status(403).json({ error: "Unauthorized access to update account settings" });
        return; // ✅ Stop execution after sending response
      }

      const validatedData = accountSettingsSchema.parse(req.body);

      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: validatedData,
        create: { userId, ...validatedData },
      });

      res.status(200).json(updatedSettings);
    } catch (error) {
      next(error); // ✅ Pass errors to Express error handler
    }
  })
);


// DELETE: User Account
router.delete(
  "/:userId",
  asyncHandler(async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && !req.user.isAdmin) {
        res.status(403).json({ error: "Unauthorized access to delete user account" });
        return; // ✅ Stop execution after sending response
      }

      await prisma.$transaction(async (tx) => {
        await tx.userSkill.deleteMany({ where: { userId } });
        await tx.userCertification.deleteMany({ where: { userId } });
        await tx.userCause.deleteMany({ where: { userId } });
        await tx.userAvailability.deleteMany({ where: { userId } });
        await tx.userPreference.deleteMany({ where: { userId } });
        await tx.userSettings.deleteMany({ where: { userId } });
        await tx.userProfile.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      });

      res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
      next(error); // ✅ Pass errors to Express error handler
    }
  })
);


export default router;
