// "use client"
// import { useUser } from "@clerk/nextjs";

// export default function AdminDashboard() {
//   const { user } = useUser();

//   return (
//     <div className="flex items-center justify-center min-h-screen">
//       <h1>Welcome, Admin {user?.firstName}!</h1>
//     </div>
//   );
// }

"use client"

import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Calendar, Award, ArrowRight, PlusCircle, UserCheck, History, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNotifications } from "@/contexts/NotificationContext"

export default function AdminDashboard() {
  const { user } = useUser(); // ✅ Get user info
  const { isLoaded, isSignedIn } = useAuth(); // ✅ Get auth state
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isLoaded && (!isSignedIn || user?.publicMetadata?.role !== "volunteer_admin")) {
      redirect("/")
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    // Simulating new notifications
    const timer = setTimeout(() => {
      addNotification("info", "New volunteer sign-up: Alice Johnson")
      addNotification("success", 'Event "Community Cleanup" is fully staffed')
    }, 2000)

    return () => clearTimeout(timer)
  }, [addNotification])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/volunteer-matching">
              <UserCheck className="mr-2 h-4 w-4" />
              Match Volunteers
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/eventform">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Event
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/volunteer-history">
              <History className="mr-2 h-4 w-4" />
              Volunteer History
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">5 events this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 require action</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Overview of recently created events</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add your events table or list here */}
            <Button variant="link" className="p-0">
              View all events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>New Volunteers</CardTitle>
            <CardDescription>Recent volunteer signups</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add your volunteers list here */}
            <Button variant="link" className="p-0">
              View all volunteers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
