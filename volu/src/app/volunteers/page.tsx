"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle, Users, AlertCircle, History, Bell } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNotifications } from "@/contexts/NotificationContext"

export default function VolunteerDashboard() {
  const { user, isLoaded } = useUser()
  const { addNotification } = useNotifications()

  useEffect(() => {
    // Simulating new notifications
    const timer = setTimeout(() => {
      addNotification("info", 'New event available: "Community Cleanup"')
      addNotification("success", 'You\'ve been matched to "Tech Workshop"')
    }, 2000)

    return () => clearTimeout(timer)
  }, [addNotification])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Welcome Section */}
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

      {/* Personal Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">+8 hours this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 more than last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Next event in 2 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">1 requires action</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events and Activity Log */}
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
                {[
                  {
                    name: "Community Cleanup",
                    date: "Sep 15, 2023",
                    location: "Central Park",
                    status: "Confirmed",
                  },
                  {
                    name: "Food Bank Assistance",
                    date: "Sep 20, 2023",
                    location: "Local Food Bank",
                    status: "Pending",
                  },
                  {
                    name: "Senior Care Visit",
                    date: "Sep 25, 2023",
                    location: "Sunshine Retirement Home",
                    status: "Confirmed",
                  },
                ].map((event) => (
                  <TableRow key={event.name}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.location}</TableCell>
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
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest volunteer actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "Hours Logged",
                  description: "You logged 4 hours for Community Cleanup",
                  time: "2 days ago",
                  icon: Clock,
                },
                {
                  title: "New Event Joined",
                  description: "You signed up for Food Bank Assistance",
                  time: "1 week ago",
                  icon: Users,
                },
                {
                  title: "Feedback Received",
                  description: "Positive feedback from Senior Care Visit",
                  time: "2 weeks ago",
                  icon: AlertCircle,
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 rounded-lg border p-4">
                  <activity.icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
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