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
  uiNotifications: UINotification[]
  addUINotification: (type: UINotificationType, message: string) => void
  removeUINotification: (id: string) => void
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
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider")
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiNotifications, setUINotifications] = useState<UINotification[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addUINotification = useCallback((type: UINotificationType, message: string) => {
    const id = uuidv4()
    setUINotifications((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeUINotification(id), 5000)
  }, [])

  const removeUINotification = useCallback((id: string) => {
    setUINotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const fetchNotifications = useCallback(async (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await notificationService.getNotifications(options)
      setNotifications(fetched)
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
      addUINotification("error", "Failed to mark notification as read")
    }
  }, [addUINotification])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
      addUINotification("error", "Failed to mark all as read")
    }
  }, [addUINotification])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      const deleted = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (deleted && !deleted.isRead) setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
      addUINotification("error", "Failed to delete notification")
    }
  }, [notifications, addUINotification])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => {
      notificationService.getUnreadCount().then((count: number) => {
        if (count > unreadCount) {
          fetchNotifications()
          addUINotification("info", `You have ${count - unreadCount} new notification${count - unreadCount > 1 ? "s" : ""}`)
        }
      }).catch(console.error)
    }, 30000)

    return () => clearInterval(interval)
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
            notification.type === "info" ? "bg-blue-100 text-blue-800" :
            notification.type === "success" ? "bg-green-100 text-green-800" :
            notification.type === "warning" ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => removeUINotification(notification.id)}
            className="ml-4 text-current hover:text-gray-600 focus:outline-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
