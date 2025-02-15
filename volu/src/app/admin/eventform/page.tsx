"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MultiSelect } from "@/components/multi-select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const skillOptions = [
  { value: "event_planning", label: "Event Planning" },
  { value: "fundraising", label: "Fundraising" },
  { value: "public_speaking", label: "Public Speaking" },
  { value: "web_development", label: "Web Development" },
  { value: "marketing", label: "Marketing" },
]

const urgencyOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
]

const eventSchema = z.object({
  name: z.string().min(1, "Event Name is required").max(100, "Event Name must be 100 characters or less"),
  description: z.string().min(1, "Event Description is required"),
  location: z.string().min(1, "Location is required"),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
  urgency: z.string().min(1, "Urgency is required"),
  eventDate: z.date({
    required_error: "Event Date is required",
  }),
})

type EventFormData = z.infer<typeof eventSchema>

export default function EventForm() {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  })

  const onSubmit = async (data: EventFormData) => {
    setLoading(true)
    try {
      // Here you would typically send the data to your backend
      console.log(data)
      toast.success("Event created successfully!")
      // Reset form or redirect
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Failed to create event. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>Fill out the form below to create a new volunteer event.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" {...register("name")} placeholder="Enter event name" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description</Label>
              <Textarea id="description" {...register("description")} placeholder="Describe the event" rows={4} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Textarea id="location" {...register("location")} placeholder="Enter event location" rows={2} />
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredSkills">Required Skills</Label>
              <Controller
                name="requiredSkills"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={skillOptions}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Select required skills"
                  />
                )}
              />
              {errors.requiredSkills && <p className="text-sm text-destructive">{errors.requiredSkills.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Controller
                name="urgency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.urgency && <p className="text-sm text-destructive">{errors.urgency.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Event Date</Label>
              <Controller
                name="eventDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.eventDate && <p className="text-sm text-destructive">{errors.eventDate.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating Event..." : "Create Event"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}