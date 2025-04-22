import express from "express"
import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../../db/client"
import { authenticateUser } from "../../middleware/auth"
import { matchingService } from "../../services/matchingService"

const router = express.Router()

// Middleware to authenticate all routes
router.use((req, res, next) => {
  authenticateUser(req, res, next).catch(next);
});

// Get matches for an event
router.get("/event/:eventId", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { id: userId, isAdmin } = req.user

    // Check if the user has permission to view matches for this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      res.status(404).json({ error: "Event not found" })
      return;
    }

    // Only the event creator or an admin can view matches
    if (event.createdBy !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view matches for this event" })
      return;
    }

    const matches = await matchingService.findMatchesForEvent(eventId)
    res.status(200).json(matches)
  } catch (error) {
    console.error("Error finding matches for event:", error)
    res.status(500).json({ error: "Failed to find matches for event" })
  }
})

// Get matches for a volunteer
router.get("/volunteer/:volunteerId", async (req: Request<{ volunteerId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { volunteerId } = req.params
    const { id: userId, isAdmin } = req.user

    // Only the volunteer themselves or an admin can view their matches
    if (volunteerId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view matches for this volunteer" })
    }

    const matches = await matchingService.findMatchesForVolunteer(volunteerId)
    res.status(200).json(matches)
  } catch (error) {
    console.error("Error finding matches for volunteer:", error)
    res.status(500).json({ error: "Failed to find matches for volunteer" })
  }
})

// Invite a volunteer to an event
router.post("/invite", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, volunteerId, message } = req.body
    const { id: userId, isAdmin } = req.user

    // Validate request body
    const inviteSchema = z.object({
      eventId: z.string(),
      volunteerId: z.string(),
      message: z.string().optional(),
    })

    inviteSchema.parse(req.body)

    // Check if the user has permission to invite volunteers to this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      res.status(404).json({ error: "Event not found" })
      return;
    }

    // Only the event creator or an admin can invite volunteers
    if (event.createdBy !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to invite volunteers to this event" })
      return;
    }

    const invitation = await matchingService.inviteVolunteerToEvent(eventId, volunteerId, message)
    res.status(201).json(invitation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error inviting volunteer to event:", error)
    res.status(500).json({ error: "Failed to invite volunteer to event" })
  }
})

// Respond to an invitation
router.post("/respond/:invitationId", async (req: Request<{ invitationId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { invitationId } = req.params
    const { accept } = req.body
    const { id: userId, isAdmin } = req.user

    // Validate request body
    const responseSchema = z.object({
      accept: z.boolean(),
    })

    responseSchema.parse(req.body)

    // Check if the invitation exists and belongs to the user
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation) {
      res.status(404).json({ error: "Invitation not found" })
      return;
    }

    // Only the invited volunteer or an admin can respond to the invitation
    if (invitation.userId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to respond to this invitation" })
      return;
    }

    const updatedInvitation = await matchingService.respondToInvitation(invitationId, accept)
    res.status(200).json(updatedInvitation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error responding to invitation:", error)
    res.status(500).json({ error: "Failed to respond to invitation" })
  }
})

// Get all invitations for a volunteer
router.get("/invitations/volunteer/:volunteerId", async (req: Request<{ volunteerId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { volunteerId } = req.params
    const { id: userId, isAdmin } = req.user

    // Only the volunteer themselves or an admin can view their invitations
    if (volunteerId !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view invitations for this volunteer" })
    }

    const invitations = await prisma.eventInvitation.findMany({
      where: { userId: volunteerId },
      include: {
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(invitations)
  } catch (error) {
    console.error("Error fetching invitations for volunteer:", error)
    res.status(500).json({ error: "Failed to fetch invitations for volunteer" })
  }
})

// Get all invitations for an event
router.get("/invitations/event/:eventId", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { id: userId, isAdmin } = req.user

    // Check if the user has permission to view invitations for this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      res.status(404).json({ error: "Event not found" })
      return;
    }

    // Only the event creator or an admin can view invitations
    if (event.createdBy !== userId && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view invitations for this event" })
    }

    const invitations = await prisma.eventInvitation.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(invitations)
  } catch (error) {
    console.error("Error fetching invitations for event:", error)
    res.status(500).json({ error: "Failed to fetch invitations for event" })
  }
})

export default router

