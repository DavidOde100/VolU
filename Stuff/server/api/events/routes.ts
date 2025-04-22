import express from "express"
import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../../db/client"
import { authenticateUser } from "../../middleware/auth"

const router = express.Router()

// Middleware to authenticate all routes
router.use((req, res, next) => {
  authenticateUser(req, res, next).catch(next);
});

// Event schema for validation
const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100, "Event name must be 100 characters or less"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be 2000 characters or less"),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Zip code must be 5 or 9 digits"),
  isVirtual: z.boolean().default(false),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().default("UTC"),
  maxVolunteers: z.number().int().positive().optional().nullable(),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
  eventType: z.string(),
  urgency: z.string(),
  causes: z.array(z.string()).min(1, "At least one cause is required"),
  images: z.array(z.string()).optional(),
  status: z.string().default("Active"),
})

// Get all events
router.get("/", async (req: Request, res: Response) : Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: {
            email: true,
          },
        },
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        causes: {
          include: {
            cause: true,
          },
        },
        skills: true,
      },
    })

    res.status(200).json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

// Get event by ID
router.get("/:eventId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        causes: {
          include: {
            cause: true,
          },
        },
        skills: true,
      },
    })

    if (!event) {
      res.status(404).json({ error: "Event not found" })
    }

     res.status(200).json(event)
  } catch (error) {
    console.error(`Error fetching event with ID ${req.params.eventId}:`, error)
     res.status(500).json({ error: "Failed to fetch event" })
  }
})

// Create new event
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.user
    const eventData = eventSchema.parse(req.body)

    // Convert string dates to Date objects if necessary
    const startDate = typeof eventData.startDate === "string" ? new Date(eventData.startDate) : eventData.startDate
    const endDate = typeof eventData.endDate === "string" ? new Date(eventData.endDate) : eventData.endDate

    // Start a transaction
    const event = await prisma.$transaction(async (tx) => {
      // Create the event
      const newEvent = await tx.event.create({
        data: {
          name: eventData.name,
          description: eventData.description,
          location: eventData.location,
          address: eventData.address,
          city: eventData.city,
          state: eventData.state,
          zip: eventData.zip,
          isVirtual: eventData.isVirtual,
          startDate,
          endDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          timezone: eventData.timezone,
          maxVolunteers: eventData.maxVolunteers,
          requiredSkills: eventData.requiredSkills,
          eventType: eventData.eventType,
          urgency: eventData.urgency,
          status: eventData.status,
          images: eventData.images || [],
          createdBy: id,
        },
      })

      // Create event skills
      await Promise.all(
        eventData.requiredSkills.map((skill) =>
          tx.eventSkill.create({
            data: {
              eventId: newEvent.id,
              name: skill,
            },
          }),
        ),
      )

      // Create event causes
      await Promise.all(
        eventData.causes.map((causeId) =>
          tx.eventCause.create({
            data: {
              eventId: newEvent.id,
              causeId,
            },
          }),
        ),
      )

      return newEvent
    })

    // Fetch the complete event with relationships
    const completeEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        causes: {
          include: {
            cause: true,
          },
        },
        skills: true,
      },
    })

     res.status(201).json(completeEvent)
  } catch (error) {
    if (error instanceof z.ZodError) {
       res.status(400).json({ error: error.errors })
    }

    console.error("Error creating event:", error)
     res.status(500).json({ error: "Failed to create event" })
  }
})

// Update event
router.put("/:eventId", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { id, isAdmin } = req.user
    const eventData = eventSchema.partial().parse(req.body)

    // Check if event exists and user has permissions
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    // Check if user is authorized
    if (existingEvent.createdBy !== id && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to update this event" });
      return;
    }

    // Convert string dates to Date objects if necessary
    const startDate =
      eventData.startDate && typeof eventData.startDate === "string"
        ? new Date(eventData.startDate)
        : eventData.startDate
    const endDate =
      eventData.endDate && typeof eventData.endDate === "string" ? new Date(eventData.endDate) : eventData.endDate

    // Start a transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Update the event
      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          ...(eventData.name && { name: eventData.name }),
          ...(eventData.description && { description: eventData.description }),
          ...(eventData.location && { location: eventData.location }),
          ...(eventData.address && { address: eventData.address }),
          ...(eventData.city && { city: eventData.city }),
          ...(eventData.state && { state: eventData.state }),
          ...(eventData.zip && { zip: eventData.zip }),
          ...(typeof eventData.isVirtual !== "undefined" && { isVirtual: eventData.isVirtual }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(eventData.startTime && { startTime: eventData.startTime }),
          ...(eventData.endTime && { endTime: eventData.endTime }),
          ...(eventData.timezone && { timezone: eventData.timezone }),
          ...(typeof eventData.maxVolunteers !== "undefined" && { maxVolunteers: eventData.maxVolunteers }),
          ...(eventData.requiredSkills && { requiredSkills: eventData.requiredSkills }),
          ...(eventData.eventType && { eventType: eventData.eventType }),
          ...(eventData.urgency && { urgency: eventData.urgency }),
          ...(eventData.status && { status: eventData.status }),
          ...(eventData.images && { images: eventData.images }),
        },
      })

      // If skills are updated, delete existing and create new
      if (eventData.requiredSkills && eventData.requiredSkills.length > 0) {
        // Delete existing skills
        await tx.eventSkill.deleteMany({
          where: { eventId },
        })

        // Create new skills
        await Promise.all(
          eventData.requiredSkills.map((skill) =>
            tx.eventSkill.create({
              data: {
                eventId,
                name: skill,
              },
            }),
          ),
        )
      }

      // If causes are updated, delete existing and create new
      if (eventData.causes && eventData.causes.length > 0) {
        // Delete existing causes
        await tx.eventCause.deleteMany({
          where: { eventId },
        })

        // Create new causes
        await Promise.all(
          eventData.causes.map((causeId) =>
            tx.eventCause.create({
              data: {
                eventId,
                causeId,
              },
            }),
          ),
        )
      }

      return event
    })

    // Fetch the complete updated event with relationships
    const completeEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        causes: {
          include: {
            cause: true,
          },
        },
        skills: true,
      },
    })

    res.status(200).json(completeEvent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return
    }

    console.error(`Error updating event with ID ${req.params.eventId}:`, error)
    res.status(500).json({ error: "Failed to update event" })
  }
})

// Delete event
router.delete("/:eventId", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { id, isAdmin } = req.user

    // Check if event exists and user has permissions
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      res.status(404).json({ error: "Event not found" })
      return;
    }

    // Check if user is the creator or an admin
    if (existingEvent.createdBy !== id && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to delete this event" })
      return;
    }

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Delete event skills
      await tx.eventSkill.deleteMany({
        where: { eventId },
      })

      // Delete event causes
      await tx.eventCause.deleteMany({
        where: { eventId },
      })

      // Delete event
      await tx.event.delete({
        where: { id: eventId },
      })
    })

    res.status(200).json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error(`Error deleting event with ID ${req.params.eventId}:`, error)
    res.status(500).json({ error: "Failed to delete event" })
  }
})

// Register volunteer for event
router.post("/:eventId/register", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { userId } = req.body

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        volunteers: true,
      },
    })

    if (!event) {
      res.status(404).json({ error: "Event not found" })
      return;
    }

    // Check if the event is full
    if (event.maxVolunteers && event.volunteers.length >= event.maxVolunteers) {
      res.status(400).json({ error: "Event is already full" })
      return;
    }

    // Check if the user is already registered
    const isRegistered = event.volunteers.some((volunteer) => volunteer.id === userId)
    if (isRegistered) {
      res.status(400).json({ error: "User is already registered for this event" })
      return;
    }

    // Register the user for the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        volunteers: {
          connect: { id: userId },
        },
        currentVolunteers: {
          increment: 1,
        },
      },
      include: {
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    res.status(200).json(updatedEvent)
  } catch (error) {
    console.error(`Error registering for event with ID ${req.params.eventId}:`, error)
    res.status(500).json({ error: "Failed to register for event" })
  }
})

// Unregister volunteer from event
router.post("/:eventId/unregister", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params
    const { userId } = req.body

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        volunteers: true,
      },
    })

    if (!event) {
      res.status(404).json({ error: "Event not found" })
      return;
    }

    // Check if the user is registered
    const isRegistered = event.volunteers.some((volunteer) => volunteer.id === userId)
    if (!isRegistered) {
      res.status(400).json({ error: "User is not registered for this event" })
      return;
    }

    // Unregister the user from the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        volunteers: {
          disconnect: { id: userId },
        },
        currentVolunteers: {
          decrement: 1,
        },
      },
      include: {
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    res.status(200).json(updatedEvent)
  } catch (error) {
    console.error(`Error unregistering from event with ID ${req.params.eventId}:`, error)
    res.status(500).json({ error: "Failed to unregister from event" })
  }
})

// Get events by user ID (events user volunteered for)
router.get("/user/:userId", async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params
    const { id, isAdmin } = req.user

    // Check if the user is requesting their own events or is an admin
    if (userId !== id && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view these events" })
    }

    const events = await prisma.event.findMany({
      where: {
        volunteers: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        causes: {
          include: {
            cause: true,
          },
        },
        skills: true,
      },
    })

     res.status(200).json(events)
  } catch (error) {
    console.error(`Error fetching events for user with ID ${req.params.userId}:`, error)
     res.status(500).json({ error: "Failed to fetch events" })
  }
})

// Get events created by user ID
router.get("/created-by/:userId", async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params
    const { id, isAdmin } = req.user

    // Check if the user is requesting their own created events or is an admin
    if (userId !== id && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to view these events" })
    }

    const events = await prisma.event.findMany({
      where: { createdBy: userId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        causes: {
          include: {
            cause: true,
          },
        },
        skills: true,
      },
    })

    res.status(200).json(events)
  } catch (error) {
    console.error(`Error fetching events created by user with ID ${req.params.userId}:`, error)
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

export default router

