"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { notificationService, type Notification } from "@/lib/api/notificationService"

export type UINotificationType = "info" | "success" | "warning" | "error"

export interface UINotification {
  id: string
  type: UINotificationType
  message: string
}

interface NotificationContextType {
  // UI Notifications (toast-like)
  uiNotifications: UINotification[]
  addUINotification: (type: UINotificationType, message: string) => void
  removeUINotification: (id: string) => void

  // API Notifications (persistent)
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  fetchNotifications: (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI Notifications state (toast-like)
  const [uiNotifications, setUINotifications] = useState<UINotification[]>([])

  // API Notifications state (persistent)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // UI Notifications methods
  const addUINotification = useCallback((type: UINotificationType, message: string) => {
    const newNotification: UINotification = {
      id: uuidv4(),
      type,
      message,
    }
    setUINotifications((prev) => [...prev, newNotification])

    // Automatically remove the notification after 5 seconds
    setTimeout(() => {
      removeUINotification(newNotification.id)
    }, 5000)
  }, [])

  const removeUINotification = useCallback((id: string) => {
    setUINotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  // API Notifications methods
  const fetchNotifications = useCallback(
    async (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
      setLoading(true)
      setError(null)
      try {
        const fetchedNotifications = await notificationService.getNotifications(options)
        setNotifications(fetchedNotifications)

        // Also update unread count
        const count = await notificationService.getUnreadCount()
        setUnreadCount(count)
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setError("Failed to fetch notifications")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId)

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification,
          ),
        )

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error("Error marking notification as read:", err)
        addUINotification("error", "Failed to mark notification as read")
      }
    },
    [addUINotification],
  )

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true, readAt: new Date().toISOString() })),
      )

      // Update unread count
      setUnreadCount(0)
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
      addUINotification("error", "Failed to mark all notifications as read")
    }
  }, [addUINotification])

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId)

        // Update local state
        const deletedNotification = notifications.find((n) => n.id === notificationId)
        setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))

        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (err) {
        console.error("Error deleting notification:", err)
        addUINotification("error", "Failed to delete notification")
      }
    },
    [notifications, addUINotification],
  )

  // Fetch notifications and unread count on mount
  useEffect(() => {
    fetchNotifications()

    // Set up polling for new notifications (every 30 seconds)
    const intervalId = setInterval(() => {
      notificationService
        .getUnreadCount()
        .then((count) => {
          if (count > unreadCount) {
            // If there are new notifications, fetch them
            fetchNotifications()
            // Optionally show a UI notification about new notifications
            addUINotification(
              "info",
              `You have ${count - unreadCount} new notification${count - unreadCount > 1 ? "s" : ""}`,
            )
          }
        })
        .catch((err) => {
          console.error("Error polling for new notifications:", err)
        })
    }, 30000)

    return () => clearInterval(intervalId)
  }, [fetchNotifications, unreadCount, addUINotification])

  return (
    <NotificationContext.Provider
      value={{
        uiNotifications,
        addUINotification,
        removeUINotification,
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const NotificationContainer: React.FC = () => {
  const { uiNotifications, removeUINotification } = useNotifications()

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {uiNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-md shadow-md flex items-center justify-between ${
            notification.type === "info"
              ? "bg-blue-100 text-blue-800"
              : notification.type === "success"
                ? "bg-green-100 text-green-800"
                : notification.type === "warning"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => removeUINotification(notification.id)}
            className="ml-4 text-current hover:text-gray-600 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

