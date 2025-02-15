import type React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useNotifications, type NotificationType } from "@/contexts/NotificationContext"

const notificationVariants = cva("fixed bottom-4 right-4 p-4 rounded-md shadow-md flex items-center justify-between", {
  variants: {
    type: {
      info: "bg-blue-100 text-blue-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
    },
  },
  defaultVariants: {
    type: "info",
  },
})

interface NotificationProps extends VariantProps<typeof notificationVariants> {
  message: string
  id: string
}

export const Notification: React.FC<NotificationProps> = ({ message, id, type }) => {
  const { removeNotification } = useNotifications()

  return (
    <div className={cn(notificationVariants({ type }))}>
      <span>{message}</span>
      <button
        onClick={() => removeNotification(id)}
        className="ml-4 text-current hover:text-gray-600 focus:outline-none"
      >
        <X size={18} />
      </button>
    </div>
  )
}

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications()

  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type as NotificationType}
        />
      ))}
    </div>
  )
}