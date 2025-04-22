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
    URGENT = "URGENT",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
  }
  
  export interface Notification {
    id: string
    title: string
    message: string
    type: NotificationType
    priority: NotificationPriority
    isRead: boolean
    createdAt: string
    readAt?: string
    metadata?: {
      [key: string]: any
    }
  }
  
  const API_BASE = "http://localhost:3001/api/notifications"
  
  export const notificationService = {
    async getNotifications(options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<Notification[]> {
      const query = new URLSearchParams()
      if (options?.limit) query.append("limit", options.limit.toString())
      if (options?.offset) query.append("offset", options.offset.toString())
      if (options?.unreadOnly) query.append("unreadOnly", "true")
  
      const res = await fetch(`${API_BASE}?${query.toString()}`, {
        credentials: "include",
      })
  
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return await res.json()
    },
  
    async getUnreadCount(): Promise<number> {
      const res = await fetch(`${API_BASE}/unread-count`, {
        credentials: "include",
      })
  
      if (!res.ok) throw new Error("Failed to fetch unread count")
      const data = await res.json()
      return data.count
    },
  
    async markAsRead(notificationId: string): Promise<void> {
      const res = await fetch(`${API_BASE}/${notificationId}/mark-read`, {
        method: "POST",
        credentials: "include",
      })
  
      if (!res.ok) throw new Error("Failed to mark notification as read")
    },
  
    async markAllAsRead(): Promise<void> {
      const res = await fetch(`${API_BASE}/mark-all-read`, {
        method: "POST",
        credentials: "include",
      })
  
      if (!res.ok) throw new Error("Failed to mark all as read")
    },
  
    async deleteNotification(notificationId: string): Promise<void> {
      const res = await fetch(`${API_BASE}/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      })
  
      if (!res.ok) throw new Error("Failed to delete notification")
    },
  }
  