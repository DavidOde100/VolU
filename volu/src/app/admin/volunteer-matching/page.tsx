"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// This would come from your database
const mockVolunteers = [
  {
    id: "1",
    name: "Alice Johnson",
    skills: ["event_planning", "marketing"],
    availability: ["weekends"],
    location: "Austin, TX",
    matchedEvents: [
      {
        id: "e1",
        name: "Community Cleanup",
        date: "2024-03-15",
        skillMatch: "90%",
        locationMatch: "100%",
      },
    ],
  },
  {
    id: "2",
    name: "Bob Smith",
    skills: ["web_development", "public_speaking"],
    availability: ["evenings"],
    location: "Austin, TX",
    matchedEvents: [
      {
        id: "e2",
        name: "Tech Workshop",
        date: "2024-03-20",
        skillMatch: "95%",
        locationMatch: "100%",
      },
    ],
  },
]

export default function VolunteerMatchingPage() {
  const [volunteers] = useState(mockVolunteers)
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  const handleMatch = async (volunteerId: string, eventId: string) => {
    setLoading({ ...loading, [`${volunteerId}-${eventId}`]: true })

    try {
      // Here you would make an API call to update the match in your database
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      toast.success("Volunteer successfully matched to event!")
    } catch (error) {
      toast.error("Failed to match volunteer to event")
    } finally {
      setLoading({ ...loading, [`${volunteerId}-${eventId}`]: false })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Matching</CardTitle>
          <CardDescription>
            Review and confirm matches between volunteers and events based on skills and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Suggested Events</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell className="font-medium">{volunteer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {volunteer.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{volunteer.availability.join(", ")}</TableCell>
                  <TableCell>{volunteer.location}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {volunteer.matchedEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-muted-foreground">{event.date}</div>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Skills: {event.skillMatch}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Location: {event.locationMatch}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {volunteer.matchedEvents.map((event) => (
                      <Button
                        key={event.id}
                        size="sm"
                        className="w-full mb-2"
                        onClick={() => handleMatch(volunteer.id, event.id)}
                        disabled={loading[`${volunteer.id}-${event.id}`]}
                      >
                        {loading[`${volunteer.id}-${event.id}`] ? (
                          "Matching..."
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Confirm Match
                          </>
                        )}
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

