"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar, Clock, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { eventService } from "@/lib/api/eventService";
import { participationService, ParticipationStatus } from "@/lib/api/participationService";

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

export default function EventDetailsPage() {
  const { id } = useParams() as { id: string };
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const res = await eventService.getEventById(id);
        setEvent(res);
      } catch (error) {
        console.error("Error loading event:", error);
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleConfirmParticipation = async () => {
    if (!user) {
      toast.error("You must be logged in to participate.");
      return;
    }

    setSubmitting(true);
    try {
      await participationService.recordParticipation({
        userId: user.id,
        eventId: event?.id || "",
        status: ParticipationStatus.CONFIRMED,
      });

      toast.success("You’ve successfully confirmed your participation!");
      router.push("/volunteers/history");
    } catch (error) {
      console.error("Error confirming participation:", error);
      toast.error("Failed to confirm participation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading event details...</div>;
  if (!event) return <div className="p-8 text-destructive">Event not found.</div>;

  const safeFormat = (date: string | Date) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? "Invalid date" : format(d, "PPP");
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>{event.description}</p>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {safeFormat(event.startDate)} – {safeFormat(event.endDate)}
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {event.startTime || "TBD"} – {event.endTime || "TBD"}
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location}
          </div>

          <Button className="mt-4" onClick={handleConfirmParticipation} disabled={submitting}>
            {submitting ? "Confirming..." : "Confirm Participation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
