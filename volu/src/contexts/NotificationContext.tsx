"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"

export type NotificationType = "info" | "success" | "warning" | "error"

export interface Notification {
  id: string
  type: NotificationType
  message: string
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (type: NotificationType, message: string) => void
  removeNotification: (id: string) => void
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
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const newNotification: Notification = {
      id: uuidv4(),
      type,
      message,
    }
    setNotifications((prev) => [...prev, newNotification])

    // Automatically remove the notification after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id)
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

