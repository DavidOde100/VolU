import express from "express"
import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../../db/client"
import { authenticateUser } from "../../middleware/auth"
import { participationService, ParticipationStatus } from "../../services/participationService"

const router = express.Router()

// Middleware to authenticate all routes
router.use((req, res, next) => {
  authenticateUser(req, res, next).catch(next);
});

// Get participation history for the current user
router.get("/my-history", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId } = req.user
    const { limit, offset, status, startDate, endDate, sortBy, sortOrder } = req.query

    const result = await participationService.getVolunteerHistory(userId, {
      limit: limit ? Number.parseInt(limit as string) : undefined,
      offset: offset ? Number.parseInt(offset as string) : undefined,
      status: status as ParticipationStatus,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    })

    res.status(200).json(result)
  } catch (error) {
    console.error("Error fetching participation history:", error)
    res.status(500).json({ error: "Failed to fetch participation history" })
  }
})

// Get participation history for an event (admin only)
router.get("/event/:eventId", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { id: userId, isAdmin } = req.user
    const { limit, offset, status, sortBy, sortOrder } = req.query

    // Check if the user has permission to view this event's participation
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      res.status(404).json({ error: "Event not found" })
      return;
    }

    // Only the event creator or an admin can view all participants
    if (event.createdBy !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view this event's participation history" })
      return;
    }

    const result = await participationService.getEventParticipationHistory(eventId, {
      limit: limit ? Number.parseInt(limit as string) : undefined,
      offset: offset ? Number.parseInt(offset as string) : undefined,
      status: status as ParticipationStatus,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    })

    res.status(200).json(result)
  } catch (error) {
    console.error("Error fetching event participation history:", error)
    res.status(500).json({ error: "Failed to fetch event participation history" })
  }
})

// Get all participation history (admin only)
router.get("/all", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to view all participation history" })
    }

    const { limit, offset, userId, eventId, status, startDate, endDate, sortBy, sortOrder } = req.query

    const result = await participationService.getAllParticipationHistory({
      limit: limit ? Number.parseInt(limit as string) : undefined,
      offset: offset ? Number.parseInt(offset as string) : undefined,
      userId: userId as string,
      eventId: eventId as string,
      status: status as ParticipationStatus,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    })

    res.status(200).json(result)
  } catch (error) {
    console.error("Error fetching all participation history:", error)
    res.status(500).json({ error: "Failed to fetch all participation history" })
  }
})

// Record participation
router.post("/record", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId, isAdmin } = req.user

    // Validate request body
    const participationSchema = z.object({
      userId: z.string(),
      eventId: z.string(),
      status: z.enum([
        ParticipationStatus.REGISTERED,
        ParticipationStatus.CONFIRMED,
        ParticipationStatus.ATTENDED,
        ParticipationStatus.NO_SHOW,
        ParticipationStatus.CANCELLED,
      ]),
      role: z.string().optional(),
      hoursLogged: z.number().min(0).optional(),
      feedback: z.string().optional(),
      adminNotes: z.string().optional(),
      checkInTime: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
      checkOutTime: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    })

    const data = participationSchema.parse(req.body)

    // Check if the user has permission to record participation
    // Users can only record their own participation unless they're an admin
    if (data.userId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to record participation for this user" })
    }

    // Admins can set any status, but regular users can only register or cancel
    if (!isAdmin && ![ParticipationStatus.REGISTERED, ParticipationStatus.CANCELLED].includes(data.status)) {
      res.status(403).json({ error: "Unauthorized to set this participation status" })
    }

    const participation = await participationService.recordParticipation(data)

    res.status(201).json(participation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return
    }

    console.error("Error recording participation:", error)
    res.status(500).json({ error: "Failed to record participation" })
  }
})

// Verify volunteer hours (admin only)
router.post("/:participationId/verify", async (req: Request<{ participationId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { participationId } = req.params
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to verify volunteer hours" })
    }

    const schema = z.object({
      verified: z.boolean(),
      adminNotes: z.string().optional(),
    })

    const { verified, adminNotes } = schema.parse(req.body)

    const participation = await participationService.verifyHours(participationId, verified, adminNotes)

    res.status(200).json(participation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error verifying hours:", error)
    res.status(500).json({ error: "Failed to verify hours" })
  }
})

// Check in a volunteer
router.post("/check-in", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId, isAdmin } = req.user

    const schema = z.object({
      userId: z.string(),
      eventId: z.string(),
      checkInTime: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    })

    const data = schema.parse(req.body)

    // Check if the user has permission to check in
    if (data.userId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to check in this user" })
    }

    const participation = await participationService.checkInVolunteer(data.userId, data.eventId, data.checkInTime)

    res.status(200).json(participation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error checking in volunteer:", error)
    res.status(500).json({ error: "Failed to check in volunteer" })
  }
})

// Check out a volunteer
router.post("/check-out", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId, isAdmin } = req.user

    const schema = z.object({
      userId: z.string(),
      eventId: z.string(),
      checkOutTime: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    })

    const data = schema.parse(req.body)

    // Check if the user has permission to check out
    if (data.userId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to check out this user" })
    }

    const participation = await participationService.checkOutVolunteer(data.userId, data.eventId, data.checkOutTime)

    res.status(200).json(participation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error checking out volunteer:", error)
    res.status(500).json({ error: "Failed to check out volunteer" })
  }
})

// Log feedback
router.post("/:eventId/feedback", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { id: userId } = req.user

    const schema = z.object({
      feedback: z.string().min(1, "Feedback is required"),
    })

    const { feedback } = schema.parse(req.body)

    const participation = await participationService.logFeedback(userId, eventId, feedback)

    res.status(200).json(participation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error logging feedback:", error)
    res.status(500).json({ error: "Failed to log feedback" })
  }
})

// Add admin notes (admin only)
router.post("/:participationId/notes", async (req: Request<{ participationId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { participationId } = req.params
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to add admin notes" })
    }

    const schema = z.object({
      adminNotes: z.string().min(1, "Admin notes are required"),
    })

    const { adminNotes } = schema.parse(req.body)

    const participation = await participationService.addAdminNotes(participationId, adminNotes)

    res.status(200).json(participation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error adding admin notes:", error)
    res.status(500).json({ error: "Failed to add admin notes" })
  }
})

// Get volunteer impact metrics
router.get("/impact", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId } = req.user

    const impact = await participationService.getVolunteerImpact(userId)

    res.status(200).json(impact)
  } catch (error) {
    console.error("Error fetching volunteer impact:", error)
    res.status(500).json({ error: "Failed to fetch volunteer impact" })
  }
})

// Get volunteer impact metrics for a specific user (admin only)
router.get("/impact/:userId", async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId: targetUserId } = req.params
    const { id: userId, isAdmin } = req.user

    // Check if the user has permission to view impact metrics
    if (targetUserId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view impact metrics for this user" })
    }

    const impact = await participationService.getVolunteerImpact(targetUserId)

    res.status(200).json(impact)
  } catch (error) {
    console.error("Error fetching volunteer impact:", error)
    res.status(500).json({ error: "Failed to fetch volunteer impact" })
  }
})

// Generate a volunteer certificate
router.post("/certificate/:eventId", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { id: userId, isAdmin } = req.user

    // Check if the user is an admin or the certificate is for themselves
    const targetUserId = req.body.userId || userId

    if (targetUserId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to generate certificate for this user" })
    }

    const certificate = await participationService.generateCertificate(targetUserId, eventId)

    res.status(201).json(certificate)
  } catch (error) {
    console.error("Error generating certificate:", error)
    res.status(500).json({ error: "Failed to generate certificate" })
  }
})

// Get volunteer certificates
router.get("/certificates", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId } = req.user

    const certificates = await participationService.getVolunteerCertificates(userId)

    res.status(200).json(certificates)
  } catch (error) {
    console.error("Error fetching certificates:", error)
    res.status(500).json({ error: "Failed to fetch certificates" })
  }
})

// Get volunteer certificates for a specific user (admin only)
router.get("/certificates/:userId", async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId: targetUserId } = req.params
    const { id: userId, isAdmin } = req.user

    // Check if the user has permission to view certificates
    if (targetUserId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view certificates for this user" })
    }

    const certificates = await participationService.getVolunteerCertificates(targetUserId)

    res.status(200).json(certificates)
  } catch (error) {
    console.error("Error fetching certificates:", error)
    res.status(500).json({ error: "Failed to fetch certificates" })
  }
})

// Get volunteer statistics
router.get("/statistics", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId } = req.user

    const statistics = await participationService.getVolunteerStatistics(userId)

    res.status(200).json(statistics)
  } catch (error) {
    console.error("Error fetching volunteer statistics:", error)
    res.status(500).json({ error: "Failed to fetch volunteer statistics" })
  }
})

// Get volunteer statistics for a specific user (admin only)
router.get("/statistics/:userId", async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId: targetUserId } = req.params
    const { id: userId, isAdmin } = req.user

    // Check if the user has permission to view statistics
    if (targetUserId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view statistics for this user" })
    }

    const statistics = await participationService.getVolunteerStatistics(targetUserId)

    res.status(200).json(statistics)
  } catch (error) {
    console.error("Error fetching volunteer statistics:", error)
    res.status(500).json({ error: "Failed to fetch volunteer statistics" })
  }
})

export default router

