"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Filter, Calendar, MapPin, Users, ArrowUpDown, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { eventService, type Event } from "@/lib/api/eventService"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [urgencyFilter, setUrgencyFilter] = useState("")
  const [sortField, setSortField] = useState<string>("startDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAllEvents()
        setEvents(data)
        setFilteredEvents(data)
      } catch (error) {
        console.error("Error fetching events:", error)
        toast.error("Failed to fetch events.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...events]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (event) =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((event) => event.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Apply urgency filter
    if (urgencyFilter) {
      result = result.filter((event) => event.urgency.toLowerCase() === urgencyFilter.toLowerCase())
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof Event]
      let bValue: any = b[sortField as keyof Event]

      // Special handling for dates
      if (sortField === "startDate" || sortField === "endDate") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredEvents(result)
  }, [events, searchTerm, statusFilter, urgencyFilter, sortField, sortDirection])

  const handleSort = (field: string) => {
    setSortDirection((prevDirection) => (field === sortField && prevDirection === "asc" ? "desc" : "asc"))
    setSortField(field)
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    setIsDeleting(true)

    try {
      await eventService.deleteEvent(eventToDelete)
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventToDelete))
      toast.success("Event deleted successfully")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event")
    } finally {
      setIsDeleting(false)
      setEventToDelete(null)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Event Management</CardTitle>
            <CardDescription>Create, view, edit, and manage volunteer events</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/events/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            <div className="relative w-full md:w-1/3">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Filter className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("")
                setUrgencyFilter("")
              }}
            >
              Reset Filters
            </Button>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Event Name
                      {sortField === "name" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("startDate")}>
                    <div className="flex items-center">
                      Date
                      {sortField === "startDate" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Volunteers</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading events...
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/events/${event.id}`} className="text-primary hover:underline">
                          {event.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(new Date(event.startDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          {event.isVirtual ? "Virtual" : event.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          {event.currentVolunteers}
                          {event.maxVolunteers ? `/${event.maxVolunteers}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getUrgencyBadge(event.urgency)}>{event.urgency}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(event.status)}>{event.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="icon" variant="ghost" asChild>
                            <Link href={`/admin/events/edit/${event.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <AlertDialog
                            open={eventToDelete === event.id}
                            onOpenChange={(open) => !open && setEventToDelete(null)}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setEventToDelete(event.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

