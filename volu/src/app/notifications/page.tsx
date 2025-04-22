"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { Bell, Check, Trash2, RefreshCw, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useNotifications } from "@/contexts/NotificationContext"
import { NotificationType, NotificationPriority } from "@/lib/api/notificationService"
import { DashboardNav } from "@/components/dashboard-nav"

export default function NotificationsPage() {
  const { user, isLoaded } = useUser()
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()
  const [activeTab, setActiveTab] = useState("all")
  const [typeFilter, setTypeFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      // Check if user is admin (in a real app, this would be more robust)
      setIsAdmin(user.publicMetadata.role === "admin")

      // Fetch notifications
      fetchNotifications()
    }
  }, [isLoaded, user, fetchNotifications])

  // Filter notifications based on active tab, type filter, and search term
  const filteredNotifications = notifications.filter((notification) => {
    // Filter by tab
    if (activeTab === "unread" && notification.isRead) {
      return false
    }

    // Filter by type
    if (typeFilter && notification.type !== typeFilter) {
      return false
    }

    // Filter by search term
    if (
      searchTerm &&
      !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    return true
  })

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

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <>
      <DashboardNav isAdmin={isAdmin} />
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>View and manage your notifications</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" onClick={() => markAllAsRead()}>
                    <Check className="mr-2 h-4 w-4" />
                    Mark all as read
                  </Button>
                )}
                <Button variant="outline" onClick={() => fetchNotifications()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {unreadCount > 0 && (
                      <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                  <div className="relative">
                    <Input
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-[200px]"
                    />
                    <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value={NotificationType.EVENT_INVITATION}>Event Invitations</SelectItem>
                      <SelectItem value={NotificationType.EVENT_ASSIGNMENT}>Event Assignments</SelectItem>
                      <SelectItem value={NotificationType.EVENT_UPDATE}>Event Updates</SelectItem>
                      <SelectItem value={NotificationType.EVENT_REMINDER}>Event Reminders</SelectItem>
                      <SelectItem value={NotificationType.EVENT_CANCELLATION}>Event Cancellations</SelectItem>
                      <SelectItem value={NotificationType.VOLUNTEER_NEEDED}>Volunteer Opportunities</SelectItem>
                      <SelectItem value={NotificationType.GENERAL_ANNOUNCEMENT}>General Announcements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator className="my-4" />
              <TabsContent value="all" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchTerm || typeFilter
                        ? "No notifications match your filters"
                        : "You don't have any notifications yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex rounded-lg border p-4 transition-colors ${
                          !notification.isRead ? "bg-muted/30" : ""
                        } ${getPriorityClass(notification.priority as NotificationPriority)}`}
                      >
                        <div className="mr-4 text-2xl">
                          {getNotificationIcon(notification.type as NotificationType)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{notification.title}</h4>
                            <div className="flex items-center space-x-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-8 px-2"
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Mark as read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {notification.metadata && notification.metadata.eventId && (
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                View Event
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="unread" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Check className="h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">You don't have any unread notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex rounded-lg border p-4 transition-colors bg-muted/30 ${getPriorityClass(
                          notification.priority as NotificationPriority,
                        )}`}
                      >
                        <div className="mr-4 text-2xl">
                          {getNotificationIcon(notification.type as NotificationType)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{notification.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 px-2"
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Mark as read
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {notification.metadata && notification.metadata.eventId && (
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                View Event
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}