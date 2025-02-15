"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// This would come from your database, filtered for the current volunteer
const mockVolunteerHistory = [
  {
    id: "1",
    eventName: "Community Cleanup",
    eventDate: new Date("2024-03-15"),
    location: "Central Park, New York",
    role: "General Volunteer",
    hours: 4,
    status: "Completed",
  },
  {
    id: "2",
    eventName: "Tech Workshop",
    eventDate: new Date("2024-03-20"),
    location: "Public Library, San Francisco",
    role: "Participant",
    hours: 3,
    status: "Upcoming",
  },
  // Add more mock data as needed
]

export default function VolunteerHistoryPage() {
  const [date, setDate] = useState<Date>()
  const [status, setStatus] = useState<string>("")

  const filteredHistory = mockVolunteerHistory.filter((entry) => {
    if (date && entry.eventDate.toDateString() !== date.toDateString()) {
      return false
    }
    if (status && entry.status !== status) {
      return false
    }
    return true
  })

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">My Volunteer History</h1>
      <div className="flex gap-4 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
        <Select onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setDate(undefined)
            setStatus("")
          }}
        >
          Reset Filters
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHistory.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.eventName}</TableCell>
              <TableCell>{format(entry.eventDate, "PPP")}</TableCell>
              <TableCell>{entry.location}</TableCell>
              <TableCell>{entry.role}</TableCell>
              <TableCell>{entry.hours}</TableCell>
              <TableCell>{entry.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}