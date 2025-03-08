import { prisma } from "../db/client"
import { sendEmail } from "../utils/emailUtils"
import { sendSMS } from "../utils/smsUtils"

export enum NotificationType {
  EVENT_INVITATION = "EVENT_INVITATION",
  EVENT_ASSIGNMENT = "EVENT_ASSIGNMENT",
  EVENT_UPDATE = "EVENT_UPDATE",
  EVENT_REMINDER = "EVENT_REMINDER",
  EVENT_CANCELLATION = "EVENT_CANCELLATION",
  VOLUNTEER_NEEDED = "VOLUNTEER_NEEDED",
  GENERAL_ANNOUNCEMENT = "GENERAL_ANNOUNCEMENT",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  metadata?: Record<string, any>
  scheduledFor?: Date
}

export const notificationService = {
  /**
   * Create a new notification
   */
  createNotification: async (data: NotificationData) => {
    const {
      userId,
      type,
      title,
      message,
      priority = NotificationPriority.MEDIUM,
      channels = [NotificationChannel.IN_APP],
      metadata = {},
      scheduledFor,
    } = data

    // Get user settings to check notification preferences
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    // Check if user has opted out of notifications
    if (userSettings) {
      if (!userSettings.emailNotifications && channels.includes(NotificationChannel.EMAIL)) {
        channels.splice(channels.indexOf(NotificationChannel.EMAIL), 1)
      }
      if (!userSettings.smsNotifications && channels.includes(NotificationChannel.SMS)) {
        channels.splice(channels.indexOf(NotificationChannel.SMS), 1)
      }
    }

    // If no channels left, don't create notification
    if (channels.length === 0) {
      return null
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority,
        channels,
        metadata,
        scheduledFor,
        isRead: false,
        status: scheduledFor ? "SCHEDULED" : "SENT",
      },
    })

    // Send notification through each channel
    if (!scheduledFor || scheduledFor <= new Date()) {
      await notificationService.deliverNotification(notification)
    }

    return notification
  },

  /**
   * Deliver a notification through all specified channels
   */
  deliverNotification: async (notification: any) => {
    const { channels, userId, title, message, metadata } = notification

    // Get user for contact information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    })

    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    // Send through each channel
    for (const channel of channels) {
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (user.email) {
            await sendEmail({
              to: user.email,
              subject: title,
              body: message,
              metadata,
            })
          }
          break

        case NotificationChannel.SMS:
          if (user.profile?.phone) {
            await sendSMS({
              to: user.profile.phone,
              message: `${title}: ${message}`,
              metadata,
            })
          }
          break

        case NotificationChannel.IN_APP:
          // In-app notifications are already stored in the database
          // They will be fetched by the frontend
          break
      }
    }

    // Update notification status to DELIVERED
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    })

    return notification
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string, userId: string) => {
    // Verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`)
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized to mark this notification as read")
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId: string) => {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string, userId: string) => {
    // Verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`)
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized to delete this notification")
    }

    return prisma.notification.delete({
      where: { id: notificationId },
    })
  },

  /**
   * Get all notifications for a user
   */
  getUserNotifications: async (
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
  ) => {
    const { limit = 20, offset = 0, unreadOnly = false } = options

    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    })
  },

  /**
   * Get unread notification count for a user
   */
  getUnreadCount: async (userId: string) => {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
  },

  /**
   * Send event assignment notification
   */
  sendEventAssignmentNotification: async (userId: string, eventId: string) => {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    const eventDate = new Date(event.startDate).toLocaleDateString()
    const eventTime = `${event.startTime} - ${event.endTime}`

    return notificationService.createNotification({
      userId,
      type: NotificationType.EVENT_ASSIGNMENT,
      title: "New Event Assignment",
      message: `You have been assigned to "${event.name}" on ${eventDate} at ${eventTime}.`,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      metadata: {
        eventId,
        eventName: event.name,
        eventDate: event.startDate,
        eventLocation: event.location,
      },
    })
  },

  /**
   * Send event update notification
   */
  sendEventUpdateNotification: async (eventId: string, updateDetails: string) => {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        volunteers: true,
      },
    })

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    // Send notification to all volunteers assigned to the event
    const notifications = []
    for (const volunteer of event.volunteers) {
      const notification = await notificationService.createNotification({
        userId: volunteer.id,
        type: NotificationType.EVENT_UPDATE,
        title: "Event Update",
        message: `Important update for "${event.name}": ${updateDetails}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        metadata: {
          eventId,
          eventName: event.name,
          updateDetails,
        },
      })
      notifications.push(notification)
    }

    return notifications
  },

  /**
   * Send event reminder notification
   */
  sendEventReminderNotification: async (eventId: string, daysUntilEvent: number) => {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        volunteers: true,
      },
    })

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    const eventDate = new Date(event.startDate).toLocaleDateString()
    const eventTime = `${event.startTime} - ${event.endTime}`

    // Send notification to all volunteers assigned to the event
    const notifications = []
    for (const volunteer of event.volunteers) {
      const notification = await notificationService.createNotification({
        userId: volunteer.id,
        type: NotificationType.EVENT_REMINDER,
        title: "Event Reminder",
        message: `Reminder: "${event.name}" is ${daysUntilEvent === 0 ? "today" : `in ${daysUntilEvent} day${daysUntilEvent > 1 ? "s" : ""}`} on ${eventDate} at ${eventTime}.`,
        priority: daysUntilEvent === 0 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
          daysUntilEvent === 0 ? NotificationChannel.SMS : null,
        ].filter(Boolean) as NotificationChannel[],
        metadata: {
          eventId,
          eventName: event.name,
          eventDate: event.startDate,
          eventLocation: event.location,
          daysUntilEvent,
        },
      })
      notifications.push(notification)
    }

    return notifications
  },

  /**
   * Send event cancellation notification
   */
  sendEventCancellationNotification: async (eventId: string, reason: string) => {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        volunteers: true,
      },
    })

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    // Send notification to all volunteers assigned to the event
    const notifications = []
    for (const volunteer of event.volunteers) {
      const notification = await notificationService.createNotification({
        userId: volunteer.id,
        type: NotificationType.EVENT_CANCELLATION,
        title: "Event Cancelled",
        message: `"${event.name}" has been cancelled. Reason: ${reason}`,
        priority: NotificationPriority.URGENT,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        metadata: {
          eventId,
          eventName: event.name,
          reason,
        },
      })
      notifications.push(notification)
    }

    return notifications
  },

  /**
   * Send volunteer needed notification
   */
  sendVolunteerNeededNotification: async (eventId: string, skillsNeeded: string[] = []) => {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    // Find volunteers with matching skills
    const skillsClause =
      skillsNeeded.length > 0
        ? {
            skills: {
              some: {
                name: {
                  in: skillsNeeded,
                },
              },
            },
          }
        : {}

    const potentialVolunteers = await prisma.user.findMany({
      where: {
        ...skillsClause,
        // Exclude volunteers already assigned to this event
        eventVolunteers: {
          none: {
            id: eventId,
          },
        },
        // Only include volunteers with active profiles
        settings: {
          profileVisibility: true,
        },
      },
      include: {
        settings: true,
      },
    })

    // Send notification to potential volunteers
    const notifications = []
    for (const volunteer of potentialVolunteers) {
      // Skip if user has opted out of notifications
      if (!volunteer.settings?.emailNotifications) {
        continue
      }

      const notification = await notificationService.createNotification({
        userId: volunteer.id,
        type: NotificationType.VOLUNTEER_NEEDED,
        title: "Volunteers Needed",
        message: `Your skills are needed for "${event.name}" on ${new Date(event.startDate).toLocaleDateString()}.`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        metadata: {
          eventId,
          eventName: event.name,
          eventDate: event.startDate,
          eventLocation: event.location,
          skillsNeeded,
        },
      })
      notifications.push(notification)
    }

    return notifications
  },

  /**
   * Schedule event reminders
   */
  scheduleEventReminders: async (eventId: string) => {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    const eventDate = new Date(event.startDate)
    const now = new Date()

    // Schedule reminders at different intervals
    const reminders = []

    // 1 week before
    const oneWeekBefore = new Date(eventDate)
    oneWeekBefore.setDate(oneWeekBefore.getDate() - 7)
    if (oneWeekBefore > now) {
      const reminder = await notificationService.scheduleEventReminder(eventId, oneWeekBefore, 7)
      reminders.push(reminder)
    }

    // 1 day before
    const oneDayBefore = new Date(eventDate)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)
    if (oneDayBefore > now) {
      const reminder = await notificationService.scheduleEventReminder(eventId, oneDayBefore, 1)
      reminders.push(reminder)
    }

    // Day of event
    const dayOfEvent = new Date(eventDate)
    dayOfEvent.setHours(8, 0, 0, 0) // 8 AM on the day of the event
    if (dayOfEvent > now) {
      const reminder = await notificationService.scheduleEventReminder(eventId, dayOfEvent, 0)
      reminders.push(reminder)
    }

    return reminders
  },

  /**
   * Schedule a single event reminder
   */
  scheduleEventReminder: async (eventId: string, scheduledFor: Date, daysUntilEvent: number) => {
    // Create a scheduled notification task
    return prisma.scheduledTask.create({
      data: {
        type: "EVENT_REMINDER",
        scheduledFor,
        status: "PENDING",
        data: {
          eventId,
          daysUntilEvent,
        } as any, // Add type assertion here
      },
    })
  },

  /**
   * Process scheduled notifications
   * This would be called by a cron job or scheduler
   */
  processScheduledNotifications: async () => {
    const now = new Date()

    // Find all scheduled notifications that are due
    const scheduledTasks = await prisma.scheduledTask.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        status: "PENDING",
      },
    })

    // Process each scheduled task
    for (const task of scheduledTasks) {
      try {
        switch (task.type) {
          case "EVENT_REMINDER":
            if (task.data) {
              const taskData = task.data as { eventId: string; daysUntilEvent: number }
              await notificationService.sendEventReminderNotification(taskData.eventId, taskData.daysUntilEvent)
            }
            break
          // Add other scheduled task types as needed
        }

        // Mark task as completed
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        })
      } catch (error) {
        console.error(`Error processing scheduled task ${task.id}:`, error)

        // Mark task as failed
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: {
            status: "FAILED",
            error: (error as Error).message,
          },
        })
      }
    }

    return scheduledTasks
  },
}