"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  ArrowLeft,
  Tag,
  Heart,
  AlertTriangle,
  CheckCircle2,
  User,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

import { eventService } from "@/lib/api/eventService"

// Map urgency to badge variant
const getUrgencyBadge = (urgency: string) => {
  switch (urgency.toLowerCase()) {
    case "low":
      return "secondary"
    case "medium":
      return "outline"
    case "high":
      return "default"
    case "critical":
      return "destructive"
    default:
      return "secondary"
  }
}

// Map status to badge variant
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "default"
    case "cancelled":
      return "destructive"
    case "completed":
      return "secondary"
    case "draft":
      return "outline"
    default:
      return "secondary"
  }
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await eventService.getEventById(id)
        setEvent(eventData)
      } catch (error) {
        console.error("Error fetching event:", error)
        toast.error("Failed to fetch event details.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  const handleDeleteEvent = async () => {
    setIsDeleting(true)
    try {
      await eventService.deleteEvent(id)
      toast.success("Event deleted successfully")
      router.push("/admin/events")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-10 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-bounce rounded-full bg-primary"></div>
              <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:0.2s]"></div>
              <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:0.4s]"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Loading event details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-10 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h2 className="mt-4 text-2xl font-bold">Event Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The event you are looking for doesn't exist or has been removed.
            </p>
            <Button asChild className="mt-6">
              <Link href="/admin/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Event Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/events/edit/${id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Link>
          </Button>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the event "{event.name}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteEvent}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{event.name}</CardTitle>
                <Badge variant={getStatusBadge(event.status)}>{event.status}</Badge>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                <span>
                  Created {format(new Date(event.createdAt), "MMM d, yyyy")} by {event.creator?.name || "Unknown"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start">
                  <Calendar className="mt-1 mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Date & Time</h4>
                    <p>
                      {format(new Date(event.startDate), "MMMM d, yyyy")}
                      {event.startDate !== event.endDate && ` - ${format(new Date(event.endDate), "MMMM d, yyyy")}`}
                    </p>
                    <p className="text-muted-foreground">
                      {event.startTime} - {event.endTime} ({event.timezone})
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="mt-1 mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Location</h4>
                    {event.isVirtual ? (
                      <p>Virtual Event - {event.location}</p>
                    ) : (
                      <>
                        <p>{event.location}</p>
                        <p className="text-muted-foreground">
                          {event.address}, {event.city}, {event.state} {event.zip}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <h3 className="font-medium mr-2">Required Skills:</h3>
                  {event.requiredSkills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline">
                      <Tag className="mr-1 h-3 w-3" />
                      {skill.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <h3 className="font-medium mr-2">Related Causes:</h3>
                  {event.causes.map((cause: any) => (
                    <Badge key={cause.id} variant="secondary">
                      <Heart className="mr-1 h-3 w-3" />
                      {cause.cause?.name || cause.causeId}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Volunteers</CardTitle>
              <CardDescription>
                {event.volunteers?.length || 0} out of {event.maxVolunteers || "∞"} volunteers registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.volunteers?.length === 0 ? (
                <div className="text-center py-6">
                  <User className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">No volunteers have registered for this event yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.volunteers?.map((volunteer: any) => (
                      <TableRow key={volunteer.id}>
                        <TableCell className="font-medium">{volunteer.name}</TableCell>
                        <TableCell>{volunteer.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Registered
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{event.eventType.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Urgency:</span>
                <Badge variant={getUrgencyBadge(event.urgency)}>{event.urgency}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Volunteers:</span>
                <span className="font-medium">
                  {event.currentVolunteers} / {event.maxVolunteers || "∞"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Virtual Event:</span>
                <span className="font-medium">{event.isVirtual ? "Yes" : "No"}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Created By</h4>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                    {event.creator?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{event.creator?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{event.creator?.email || ""}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href="/admin/volunteer-matching">Find Matches</Link>
              </Button>
              <Button variant="outline" className="w-full">
                Send Email to Volunteers
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/events/edit/${id}`}>Edit Event</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}