import express from "express"
import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { authenticateUser } from "../../middleware/auth"
import {
  notificationService,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from "../../services/notificationService"

const router = express.Router()

// Middleware to authenticate all routes
router.use((req, res, next) => {
  authenticateUser(req, res, next).catch(next);
});

// Get notifications for the current user
router.get("/", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId } = req.user
    const { limit, offset, unreadOnly } = req.query

    const notifications = await notificationService.getUserNotifications(userId, {
      limit: limit ? Number.parseInt(limit as string) : undefined,
      offset: offset ? Number.parseInt(offset as string) : undefined,
      unreadOnly: unreadOnly === "true",
    })

    res.status(200).json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
})

// Get unread notification count
router.get("/unread-count", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId } = req.user

    const count = await notificationService.getUnreadCount(userId)
    res.status(200).json({ count })
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    res.status(500).json({ error: "Failed to fetch unread notification count" })
  }
})

// Mark a notification as read
router.put("/:notificationId/read", async (req: Request<{ notificationId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params
    const { id: userId } = req.user

    const notification = await notificationService.markAsRead(notificationId, userId)
    res.status(200).json(notification)
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({ error: "Failed to mark notification as read" })
  }
})

// Mark all notifications as read
router.put("/mark-all-read", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: userId } = req.user

    await notificationService.markAllAsRead(userId)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    res.status(500).json({ error: "Failed to mark all notifications as read" })
  }
})

// Delete a notification
router.delete("/:notificationId", async (req: Request<{ notificationId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params
    const { id: userId } = req.user

    await notificationService.deleteNotification(notificationId, userId)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    res.status(500).json({ error: "Failed to delete notification" })
  }
})

// Create a notification (admin only)
router.post("/", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to create notifications" })
    }

    const notificationSchema = z.object({
      userId: z.string(),
      type: z.enum([
        NotificationType.EVENT_INVITATION,
        NotificationType.EVENT_ASSIGNMENT,
        NotificationType.EVENT_UPDATE,
        NotificationType.EVENT_REMINDER,
        NotificationType.EVENT_CANCELLATION,
        NotificationType.VOLUNTEER_NEEDED,
        NotificationType.GENERAL_ANNOUNCEMENT,
      ]),
      title: z.string(),
      message: z.string(),
      priority: z
        .enum([
          NotificationPriority.LOW,
          NotificationPriority.MEDIUM,
          NotificationPriority.HIGH,
          NotificationPriority.URGENT,
        ])
        .optional(),
      channels: z
        .array(z.enum([NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS]))
        .optional(),
      metadata: z.record(z.any()).optional(),
      scheduledFor: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    })

    const validatedData = notificationSchema.parse(req.body)
    const notification = await notificationService.createNotification(validatedData)

    res.status(201).json(notification)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error creating notification:", error)
    res.status(500).json({ error: "Failed to create notification" })
  }
})

// Send event assignment notification
router.post("/event-assignment", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to send event assignment notifications" })
    }

    const schema = z.object({
      userId: z.string(),
      eventId: z.string(),
    })

    const { userId, eventId } = schema.parse(req.body)
    const notification = await notificationService.sendEventAssignmentNotification(userId, eventId)

    res.status(201).json(notification)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error sending event assignment notification:", error)
    res.status(500).json({ error: "Failed to send event assignment notification" })
  }
})

// Send event update notification
router.post("/event-update", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to send event update notifications" })
    }

    const schema = z.object({
      eventId: z.string(),
      updateDetails: z.string(),
    })

    const { eventId, updateDetails } = schema.parse(req.body)
    const notifications = await notificationService.sendEventUpdateNotification(eventId, updateDetails)

    res.status(201).json(notifications)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error sending event update notification:", error)
    res.status(500).json({ error: "Failed to send event update notification" })
  }
})

// Send event reminder notification
router.post("/event-reminder", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to send event reminder notifications" })
    }

    const schema = z.object({
      eventId: z.string(),
      daysUntilEvent: z.number().int().min(0),
    })

    const { eventId, daysUntilEvent } = schema.parse(req.body)
    const notifications = await notificationService.sendEventReminderNotification(eventId, daysUntilEvent)

    res.status(201).json(notifications)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error sending event reminder notification:", error)
    res.status(500).json({ error: "Failed to send event reminder notification" })
  }
})

// Send event cancellation notification
router.post("/event-cancellation", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to send event cancellation notifications" })
    }

    const schema = z.object({
      eventId: z.string(),
      reason: z.string(),
    })

    const { eventId, reason } = schema.parse(req.body)
    const notifications = await notificationService.sendEventCancellationNotification(eventId, reason)

    res.status(201).json(notifications)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error sending event cancellation notification:", error)
    res.status(500).json({ error: "Failed to send event cancellation notification" })
  }
})

// Send volunteer needed notification
router.post("/volunteer-needed", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to send volunteer needed notifications" })
    }

    const schema = z.object({
      eventId: z.string(),
      skillsNeeded: z.array(z.string()).optional(),
    })

    const { eventId, skillsNeeded } = schema.parse(req.body)
    const notifications = await notificationService.sendVolunteerNeededNotification(eventId, skillsNeeded)

    res.status(201).json(notifications)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error sending volunteer needed notification:", error)
    res.status(500).json({ error: "Failed to send volunteer needed notification" })
  }
})

// Schedule event reminders
router.post("/schedule-event-reminders", async (req: Request<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isAdmin } = req.user

    if (!isAdmin) {
      res.status(403).json({ error: "Unauthorized to schedule event reminders" })
    }

    const schema = z.object({
      eventId: z.string(),
    })

    const { eventId } = schema.parse(req.body)
    const reminders = await notificationService.scheduleEventReminders(eventId)

    res.status(201).json(reminders)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return;
    }

    console.error("Error scheduling event reminders:", error)
    res.status(500).json({ error: "Failed to schedule event reminders" })
  }
})

export default router

