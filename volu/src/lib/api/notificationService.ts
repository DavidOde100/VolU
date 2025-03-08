import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Create an axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export enum NotificationType {
  EVENT_INVITATION = "EVENT_INVITATION",
  EVENT_ASSIGNMENT = "EVENT_ASSIGNMENT",
  EVENT_UPDATE = "EVENT_UPDATE",
  EVENT_REMINDER = "EVENT_REMINDER",
  EVENT_CANCELLATION = "EVENT_CANCELLATION",
  VOLUNTEER_NEEDED = "VOLUNTEER_NEEDED",
  GENERAL_ANNOUNCEMENT = "GENERAL_ANNOUNCEMENT",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  channels: string[]
  metadata?: Record<string, any>
  isRead: boolean
  readAt?: string
  status: string
  scheduledFor?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

export const notificationService = {
  // Get notifications for the current user
  getNotifications: async (
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
  ): Promise<Notification[]> => {
    try {
      const { limit, offset, unreadOnly } = options
      const params = new URLSearchParams()

      if (limit) params.append("limit", limit.toString())
      if (offset) params.append("offset", offset.toString())
      if (unreadOnly) params.append("unreadOnly", "true")

      const response = await api.get(`/notifications?${params.toString()}`)
      return response.data as Notification[]
    } catch (error) {
      console.error("Error fetching notifications:", error)
      throw error
    }
  },

  // Get unread notification count
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get("/notifications/unread-count")
      return (response.data as { count: number }).count
    } catch (error) {
      console.error("Error fetching unread notification count:", error)
      throw error
    }
  },

  // Mark a notification as read
  markAsRead: async (notificationId: string): Promise<Notification> => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`)
      return response.data as Notification
    } catch (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put("/notifications/mark-all-read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${notificationId}`)
    } catch (error) {
      console.error("Error deleting notification:", error)
      throw error
    }
  },

  // Admin functions

  // Create a notification (admin only)
  createNotification: async (data: {
    userId: string
    type: NotificationType
    title: string
    message: string
    priority?: NotificationPriority
    channels?: string[]
    metadata?: Record<string, any>
    scheduledFor?: Date
  }): Promise<Notification> => {
    try {
      const response = await api.post("/notifications", data)
      return response.data as Notification
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  },

  // Send event assignment notification (admin only)
  sendEventAssignmentNotification: async (userId: string, eventId: string): Promise<Notification> => {
    try {
      const response = await api.post("/notifications/event-assignment", { userId, eventId })
      return response.data as Notification
    } catch (error) {
      console.error("Error sending event assignment notification:", error)
      throw error
    }
  },

  // Send event update notification (admin only)
  sendEventUpdateNotification: async (eventId: string, updateDetails: string): Promise<Notification[]> => {
    try {
      const response = await api.post("/notifications/event-update", { eventId, updateDetails })
      return response.data as Notification[]
    } catch (error) {
      console.error("Error sending event update notification:", error)
      throw error
    }
  },

  // Send event reminder notification (admin only)
  sendEventReminderNotification: async (eventId: string, daysUntilEvent: number): Promise<Notification[]> => {
    try {
      const response = await api.post("/notifications/event-reminder", { eventId, daysUntilEvent })
      return response.data as Notification[]
    } catch (error) {
      console.error("Error sending event reminder notification:", error)
      throw error
    }
  },

  // Send event cancellation notification (admin only)
  sendEventCancellationNotification: async (eventId: string, reason: string): Promise<Notification[]> => {
    try {
      const response = await api.post("/notifications/event-cancellation", { eventId, reason })
      return response.data as Notification[]
    } catch (error) {
      console.error("Error sending event cancellation notification:", error)
      throw error
    }
  },

  // Send volunteer needed notification (admin only)
  sendVolunteerNeededNotification: async (eventId: string, skillsNeeded?: string[]): Promise<Notification[]> => {
    try {
      const response = await api.post("/notifications/volunteer-needed", { eventId, skillsNeeded })
      return response.data as Notification[]
    } catch (error) {
      console.error("Error sending volunteer needed notification:", error)
      throw error
    }
  },

  // Schedule event reminders (admin only)
  scheduleEventReminders: async (eventId: string): Promise<any[]> => {
    try {
      const response = await api.post("/notifications/schedule-event-reminders", { eventId })
      return response.data as any[]
    } catch (error) {
      console.error("Error scheduling event reminders:", error)
      throw error
    }
  },
}

