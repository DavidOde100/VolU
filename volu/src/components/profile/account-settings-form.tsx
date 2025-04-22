"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
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

// Email frequency options
const emailFrequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "never", label: "Never" },
]

// Validation schema using Zod
const accountSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  emailFrequency: z.string(),
  smsNotifications: z.boolean(),
  profileVisibility: z.boolean(),
})

type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>

interface AccountSettingsFormProps {
  user: any // ✅ Clerk's user object (removed incorrect import)
}

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const form = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      emailNotifications: (user?.publicMetadata?.emailNotifications as boolean) ?? true,
      emailFrequency: (user?.publicMetadata?.emailFrequency as string) || "weekly",
      smsNotifications: (user?.publicMetadata?.smsNotifications as boolean) ?? false,
      profileVisibility: (user?.publicMetadata?.profileVisibility as boolean) ?? true,
    },
  })

  async function onSubmit(data: AccountSettingsFormValues) {
    if (!user) {
      toast.error("User not found")
      return
    }

    setIsLoading(true)
    try {
      // ✅ Correct way to update user metadata in Clerk
      await fetch("/api/update-notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          publicMetadata: {
            emailNotifications: data.emailNotifications,
            emailFrequency: data.emailFrequency,
            smsNotifications: data.smsNotifications,
            profileVisibility: data.profileVisibility,
          },
        }),
      })

      toast.success("Account settings updated successfully")
    } catch (error) {
      console.error("Error updating account settings:", error)
      toast.error("Failed to update account settings")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (!user) {
      toast.error("User not found")
      return
    }

    try {
      // ⚠️ Implement proper account deletion logic here
      toast.error("Account deletion is not implemented in this demo")
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account")
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Notifications</FormLabel>
                    <FormDescription>Receive email notifications about updates</FormDescription>
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
                      {emailFrequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>How often would you like to receive email updates?</FormDescription>
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
                    <FormDescription>Receive text message notifications for important updates</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Privacy</h3>
            <FormField
              control={form.control}
              name="profileVisibility"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Profile Visibility</FormLabel>
                    <FormDescription>Make your profile visible to others</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <div className="rounded-lg border border-destructive p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-destructive">Delete Account</h4>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}


