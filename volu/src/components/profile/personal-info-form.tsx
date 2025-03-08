"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import type { User } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { userProfileService, type PersonalInfo } from "@/lib/api/userProfileService"

// State options
const stateOptions = [
  { value: "TX", label: "Texas" },
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "FL", label: "Florida" },
  { value: "IL", label: "Illinois" },
]

const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(50, "Name must be 50 characters or less"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address1: z.string().min(1, "Address is required").max(100, "Address must be 100 characters or less"),
  address2: z.string().max(100, "Address must be 100 characters or less").optional(),
  city: z.string().min(1, "City is required").max(50, "City must be 50 characters or less"),
  state: z.string().min(2, "State is required").max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Zip code must be 5 or 9 digits"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
})

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>

interface PersonalInfoFormProps {
  user: any
}

export function PersonalInfoForm({ user }: PersonalInfoFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: (user?.unsafeMetadata?.fullName as string) || user?.fullName || "",
      email: user?.emailAddresses[0]?.emailAddress || "",
      phone: (user?.unsafeMetadata?.phone as string) || user?.phoneNumbers[0]?.phoneNumber || "",
      address1: (user?.unsafeMetadata?.address1 as string) || "",
      address2: (user?.unsafeMetadata?.address2 as string) || "",
      city: (user?.unsafeMetadata?.city as string) || "",
      state: (user?.unsafeMetadata?.state as string) || "",
      zip: (user?.unsafeMetadata?.zip as string) || "",
      bio: (user?.unsafeMetadata?.bio as string) || "",
    },
  })

  async function onSubmit(data: PersonalInfoFormValues) {
    setIsLoading(true)
    try {
      // Extract the data we need to send to the API
      const personalInfo: PersonalInfo = {
        fullName: data.fullName,
        phone: data.phone,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        bio: data.bio,
      }
      
      // Update user profile via API
      await userProfileService.updatePersonalInfo(user.id, personalInfo)
      
      // Also update Clerk metadata for client-side access
      await user.update({
        firstName: data.fullName.split(" ")[0],
        lastName: data.fullName.split(" ").slice(1).join(" "),
        unsafeMetadata: {
          ...user.unsafeMetadata,
          fullName: data.fullName,
          phone: data.phone,
          address1: data.address1,
          address2: data.address2,
          city: data.city,
          state: data.state,
          zip: data.zip,
          bio: data.bio,
        },
      })
      
      toast.success("Personal information updated successfully")
    } catch (error) {
      console.error("Error updating personal information:", error)
      toast.error("Failed to update personal information")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zip Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Tell us a bit about yourself..." className="h-32 resize-none" />
              </FormControl>
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


