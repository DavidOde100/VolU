"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Days of the week
const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
]

// Time slots
const timeSlots = [
  { value: "morning", label: "Morning (8am-12pm)" },
  { value: "afternoon", label: "Afternoon (12pm-5pm)" },
  { value: "evening", label: "Evening (5pm-9pm)" },
]

// Notice period options
const noticePeriodOptions = [
  { value: "1", label: "1 day" },
  { value: "2", label: "2 days" },
  { value: "3", label: "3 days" },
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "1 month" },
]

// Schema validation using Zod
const availabilitySchema = z.object({
  availableDays: z.array(z.string()).min(1, "Please select at least one day"),
  availableTimeSlots: z.array(z.string()).min(1, "Please select at least one time slot"),
  specificDates: z.array(z.date()).optional(),
  blackoutDates: z.array(z.date()).optional(),
  minimumNoticePeriod: z.string(),
  flexibleSchedule: z.boolean(),
})

type AvailabilityFormValues = z.infer<typeof availabilitySchema>

interface AvailabilityFormProps {
  user: any // ✅ Clerk's user object (removed incorrect import)
}

export function AvailabilityForm({ user }: AvailabilityFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availableDays: (user?.publicMetadata?.availableDays as string[]) || [],
      availableTimeSlots: (user?.publicMetadata?.availableTimeSlots as string[]) || [],
      specificDates: Array.isArray(user?.publicMetadata?.specificDates)
        ? (user.publicMetadata.specificDates as string[]).map((date) => new Date(date))
        : [],
      blackoutDates: Array.isArray(user?.publicMetadata?.blackoutDates)
        ? (user.publicMetadata.blackoutDates as string[]).map((date) => new Date(date))
        : [],
      minimumNoticePeriod: (user?.publicMetadata?.minimumNoticePeriod as string) || "3",
      flexibleSchedule: (user?.publicMetadata?.flexibleSchedule as boolean) || false,
    },
  })

  async function onSubmit(data: AvailabilityFormValues) {
    if (!user) {
      toast.error("User not found")
      return
    }

    setIsLoading(true)
    try {
      // ✅ Correct way to update user metadata in Clerk
      await fetch("/api/update-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          publicMetadata: {
            availableDays: data.availableDays,
            availableTimeSlots: data.availableTimeSlots,
            specificDates: data.specificDates?.map((d) => d.toISOString()),
            blackoutDates: data.blackoutDates?.map((d) => d.toISOString()),
            minimumNoticePeriod: data.minimumNoticePeriod,
            flexibleSchedule: data.flexibleSchedule,
          },
        }),
      })

      toast.success("Availability updated successfully")
    } catch (error) {
      console.error("Error updating availability:", error)
      toast.error("Failed to update availability")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="availableDays"
          render={() => (
            <FormItem>
              <FormLabel>Available Days</FormLabel>
              <FormDescription>Select the days of the week you're typically available</FormDescription>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day.id}
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, day.id])
                                : field.onChange(field.value?.filter((value) => value !== day.id))
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{day.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minimumNoticePeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Notice Period</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notice period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {noticePeriodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>How much advance notice do you need for volunteer opportunities?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  )
}