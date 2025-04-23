"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle, Users, AlertCircle, History, Bell } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNotifications } from "@/contexts/NotificationContext"
import { participationService, ParticipationRecord, VolunteerStatistics } from "@/lib/api/participationService"
import { format } from "date-fns"

export default function VolunteerDashboard() {
  const { user, isLoaded } = useUser()
  const { addUINotification } = useNotifications()

  const [statistics, setStatistics] = useState<VolunteerStatistics | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<ParticipationRecord[]>([])
  const [recentActivity, setRecentActivity] = useState<ParticipationRecord[]>([])

  useEffect(() => {
    if (!isLoaded || !user) return

    const fetchData = async () => {
      try {
        const stats = await participationService.getVolunteerStatistics(user.id)
        setStatistics(stats)

        const result = await participationService.getMyHistory({
          userId: user.id,
          limit: 10,
          sortBy: "event.startDate",
          sortOrder: "desc",
        })

        const now = new Date()
        const upcoming = result.history.filter(
          (r) => r.event?.startDate && new Date(r.event.startDate) > now
        )
        const recent = result.history.filter(
          (r) => r.event?.startDate && new Date(r.event.startDate) <= now
        )

        setUpcomingEvents(upcoming.slice(0, 3))
        setRecentActivity(recent.slice(0, 3))

        addUINotification("info", 'New event available: "Community Cleanup"')
        addUINotification("success", 'You\'ve been matched to "Tech Workshop"')
      } catch (err) {
        toast.error("Failed to load dashboard data")
        console.error(err)
      }
    }

    fetchData()
  }, [isLoaded, user])

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.firstName}!</h1>
          <p className="text-muted-foreground">Here's an overview of your volunteer activities.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/volunteers/history">
              <History className="mr-2 h-4 w-4" />
              View History
            </Link>
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Find New Opportunities
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalHours ?? 0}</div>
            <p className="text-xs text-muted-foreground">+8 hours this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.statusCounts?.Attended ?? 0}</div>
            <p className="text-xs text-muted-foreground">3 more than last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Next event in 2 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.statusCounts?.Confirmed ?? 0}</div>
            <p className="text-xs text-muted-foreground">1 requires action</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your scheduled volunteer activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.event?.name}</TableCell>
                    <TableCell>{event.event?.startDate ? format(new Date(event.event.startDate), "PPP") : "N/A"}</TableCell>
                    <TableCell>{event.event?.location ?? "TBA"}</TableCell>
                    <TableCell>{event.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="link" className="mt-4 p-0">
              View all events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest volunteer actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 rounded-lg border p-4">
                  <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.event?.name ?? "Event"}</p>
                    <p className="text-sm text-muted-foreground">{activity.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.event?.startDate ? format(new Date(activity.event.startDate), "PPP") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common volunteer tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
            <Calendar className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Find Events</div>
              <div className="text-xs text-muted-foreground">Discover new volunteer opportunities</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
            <Clock className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Log Hours</div>
              <div className="text-xs text-muted-foreground">Record your volunteer time</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
            <MapPin className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Update Preferences</div>
              <div className="text-xs text-muted-foreground">Set your skills and interests</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
            <Users className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Invite Friends</div>
              <div className="text-xs text-muted-foreground">Share volunteer opportunities</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
