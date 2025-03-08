"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import type { User } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  emailFrequency: z.string(),
  smsNotifications: z.boolean(),
  notificationTypes: z.array(z.string()),
})

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>

interface NotificationSettingsFormProps {
  user: any
}

export function NotificationSettingsForm({ user }: NotificationSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: (user?.unsafeMetadata?.emailNotifications as boolean) ?? true,
      emailFrequency: (user?.unsafeMetadata?.emailFrequency as string) || "daily",
      smsNotifications: (user?.unsafeMetadata?.smsNotifications as boolean) ?? false,
      notificationTypes: (user?.unsafeMetadata?.notificationTypes as string[]) || [
        "EVENT_ASSIGNMENT",
        "EVENT_UPDATE",
        "EVENT_REMINDER",
        "EVENT_CANCELLATION",
      ],
    },
  })

  async function onSubmit(data: NotificationSettingsFormValues) {
    setIsLoading(true)
    try {
      // Update user metadata in Clerk
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          emailNotifications: data.emailNotifications,
          emailFrequency: data.emailFrequency,
          smsNotifications: data.smsNotifications,
          notificationTypes: data.notificationTypes,
        },
      })
      toast.success("Notification settings updated successfully")
    } catch (error) {
      console.error("Error updating notification settings:", error)
      toast.error("Failed to update notification settings")
    } finally {
      setIsLoading(false)
    }
  }

  const notificationTypes = [
    { id: "EVENT_INVITATION", label: "Event Invitations" },
    { id: "EVENT_ASSIGNMENT", label: "Event Assignments" },
    { id: "EVENT_UPDATE", label: "Event Updates" },
    { id: "EVENT_REMINDER", label: "Event Reminders" },
    { id: "EVENT_CANCELLATION", label: "Event Cancellations" },
    { id: "VOLUNTEER_NEEDED", label: "Volunteer Opportunities" },
    { id: "GENERAL_ANNOUNCEMENT", label: "General Announcements" },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Preferences</h3>
          <FormField
            control={form.control}
            name="emailNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Email Notifications</FormLabel>
                  <FormDescription>Receive email notifications about events and updates</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>How often would you like to receive email notifications?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="smsNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">SMS Notifications</FormLabel>
                  <FormDescription>Receive text message notifications for urgent updates</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notificationTypes"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Notification Types</FormLabel>
                  <FormDescription>Select which types of notifications you want to receive</FormDescription>
                </div>
                <div className="space-y-2">
                  {notificationTypes.map((type) => (
                    <FormField
                      key={type.id}
                      control={form.control}
                      name="notificationTypes"
                      render={({ field }) => {
                        return (
                          <FormItem key={type.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, type.id])
                                    : field.onChange(field.value?.filter((value) => value !== type.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{type.label}</FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

