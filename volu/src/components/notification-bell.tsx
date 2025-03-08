"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { format } from "date-fns"
import { useNotifications } from "@/contexts/NotificationContext"
import { NotificationType, NotificationPriority } from "@/lib/api/notificationService"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [open, setOpen] = useState(false)

  // Handle opening the notification popover
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.EVENT_INVITATION:
        return "🎫"
      case NotificationType.EVENT_ASSIGNMENT:
        return "✅"
      case NotificationType.EVENT_UPDATE:
        return "🔄"
      case NotificationType.EVENT_REMINDER:
        return "⏰"
      case NotificationType.EVENT_CANCELLATION:
        return "❌"
      case NotificationType.VOLUNTEER_NEEDED:
        return "🙋"
      case NotificationType.GENERAL_ANNOUNCEMENT:
        return "📢"
      default:
        return "📋"
    }
  }

  // Get notification priority class
  const getPriorityClass = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return "border-l-4 border-red-500"
      case NotificationPriority.HIGH:
        return "border-l-4 border-orange-500"
      case NotificationPriority.MEDIUM:
        return "border-l-4 border-blue-500"
      case NotificationPriority.LOW:
        return "border-l-4 border-gray-300"
      default:
        return "border-l-4 border-gray-300"
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                markAllAsRead()
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex p-3 hover:bg-muted/50 rounded-md transition-colors ${!notification.isRead ? "bg-muted/30" : ""} ${getPriorityClass(notification.priority as NotificationPriority)}`}
                >
                  <div className="mr-3 text-xl">{getNotificationIcon(notification.type as NotificationType)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

