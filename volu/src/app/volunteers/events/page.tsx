"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Clock } from "lucide-react"
import { eventService } from "@/lib/api/eventService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type EventData = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location: string;
}

export default function VolunteerEventsPage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getAllEvents()
        const formattedEvents = res.map(event => ({
          ...event,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString()
        }));
        setEvents(formattedEvents)
      } catch (error) {
        toast.error("Failed to load events")
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4">Upcoming Volunteer Events</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading...</p>
        ) : events.length === 0 ? (
          <p>No upcoming events available.</p>
        ) : (
          events.map((event) => (
            <Link key={event.id} href={`/volunteers/events/${event.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.startDate), "MMM d, yyyy")} - {format(new Date(event.endDate), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {event.startTime || "TBD"} - {event.endTime || "TBD"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
