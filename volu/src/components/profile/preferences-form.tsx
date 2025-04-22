"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MultiSelect } from "@/components/multi-select"

// Cause options
const causeOptions = [
  { value: "education", label: "Education" },
  { value: "environment", label: "Environment" },
  { value: "health", label: "Health & Wellness" },
  { value: "animals", label: "Animal Welfare" },
  { value: "arts", label: "Arts & Culture" },
  { value: "community", label: "Community Development" },
  { value: "disaster", label: "Disaster Relief" },
  { value: "hunger", label: "Hunger & Homelessness" },
  { value: "human_rights", label: "Human Rights" },
  { value: "children", label: "Children & Youth" },
  { value: "seniors", label: "Seniors" },
  { value: "veterans", label: "Veterans" },
  { value: "disabilities", label: "Disabilities" },
  { value: "international", label: "International" },
]

// Distance options
const distanceOptions = [
  { value: "5", label: "Within 5 miles" },
  { value: "10", label: "Within 10 miles" },
  { value: "25", label: "Within 25 miles" },
  { value: "50", label: "Within 50 miles" },
  { value: "100", label: "Within 100 miles" },
  { value: "any", label: "Any distance" },
]

// Frequency options
const frequencyOptions = [
  { id: "one_time", label: "One-time events" },
  { id: "weekly", label: "Weekly commitment" },
  { id: "monthly", label: "Monthly commitment" },
  { id: "flexible", label: "Flexible schedule" },
]

// Communication preference options
const communicationOptions = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text Message" },
]

const preferencesSchema = z.object({
  causes: z.array(z.string()).min(1, "Please select at least one cause"),
  preferredDistance: z.string(),
  frequency: z.string(),
  remoteOpportunities: z.boolean(),
  communicationPreference: z.string(),
  additionalPreferences: z.string().max(500, "Additional preferences must be 500 characters or less").optional(),
})

type PreferencesFormValues = z.infer<typeof preferencesSchema>

interface PreferencesFormProps {
  user: any // ✅ Clerk's user object (removed incorrect import)
}

export function PreferencesForm({ user }: PreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      causes: (user?.publicMetadata?.causes as string[]) || [],
      preferredDistance: (user?.publicMetadata?.preferredDistance as string) || "10",
      frequency: (user?.publicMetadata?.frequency as string) || "flexible",
      remoteOpportunities: (user?.publicMetadata?.remoteOpportunities as boolean) || false,
      communicationPreference: (user?.publicMetadata?.communicationPreference as string) || "email",
      additionalPreferences: (user?.publicMetadata?.additionalPreferences as string) || "",
    },
  })

  async function onSubmit(data: PreferencesFormValues) {
    if (!user) {
      toast.error("User not found")
      return
    }

    setIsLoading(true)
    try {
      // ✅ Correct way to update user metadata in Clerk
      await fetch("/api/update-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          metadata: {
            causes: data.causes,
            preferredDistance: data.preferredDistance,
            frequency: data.frequency,
            remoteOpportunities: data.remoteOpportunities,
            communicationPreference: data.communicationPreference,
            additionalPreferences: data.additionalPreferences,
          },
        }),
      })
      toast.success("Preferences updated successfully")
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast.error("Failed to update preferences")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="causes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Causes You Care About</FormLabel>
              <FormControl>
                <MultiSelect
                  options={causeOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Select causes"
                />
              </FormControl>
              <FormDescription>Select causes that you're passionate about and would like to support</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredDistance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Distance</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred distance" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {distanceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>How far are you willing to travel for volunteer opportunities?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="communicationPreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Communication Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select communication preference" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {communicationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>How would you prefer to be contacted about volunteer opportunities?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalPreferences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Preferences (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Any other preferences or requirements..."
                  className="h-32 resize-none"
                />
              </FormControl>
              <FormDescription>Share any other preferences or requirements for volunteer opportunities</FormDescription>
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

