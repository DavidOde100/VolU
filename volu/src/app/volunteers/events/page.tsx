"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

import { eventService } from "@/lib/api/eventService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type EventData = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  startTime?: string;
  endTime?: string;
  location: string;
};

export default function VolunteerEventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventService.getAllEvents();
        if (!Array.isArray(res)) throw new Error("Invalid data format");
        setEvents(res);
      } catch (error) {
        console.error("Event load error:", error);
        toast.error("Could not load events.");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-4">Upcoming Volunteer Events</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">No upcoming events available.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={`/volunteers/events/${event.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {event.startDate && !isNaN(new Date(event.startDate).getTime())
                      ? format(new Date(event.startDate), "MMM d, yyyy")
                      : "Start date unknown"}
                    {" – "}
                    {event.endDate && !isNaN(new Date(event.endDate).getTime())
                      ? format(new Date(event.endDate), "MMM d, yyyy")
                      : "End date unknown"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {event.startTime || "TBD"} – {event.endTime || "TBD"}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

