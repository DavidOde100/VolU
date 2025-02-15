"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { DashboardNav } from "@/components/dashboard-nav"

// State options (2-letter codes stored in DB)
const stateOptions = [
  { value: "TX", label: "Texas" },
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "FL", label: "Florida" },
  { value: "IL", label: "Illinois" },
]

// Skill options
const skillOptions = [
  { value: "event_planning", label: "Event Planning" },
  { value: "fundraising", label: "Fundraising" },
  { value: "public_speaking", label: "Public Speaking" },
  { value: "web_development", label: "Web Development" },
  { value: "marketing", label: "Marketing" },
]

// Form validation schema using Zod
const RegistrationSchema = z.object({
  fullName: z.string().min(1, "Full Name is required").max(50),
  address1: z.string().min(1, "Address is required").max(100),
  address2: z.string().max(100).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(2, "State is required").max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Zip code must be 5 or 9 digits"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  preferences: z.string().max(500).optional(),
  availability: z.array(z.date()).min(1, "Please select at least one available date"),
})

type RegistrationData = z.infer<typeof RegistrationSchema>

export default function RegistrationPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegistrationData>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      fullName: (user?.unsafeMetadata?.fullName as string) || "",
      address1: (user?.unsafeMetadata?.address1 as string) || "",
      address2: (user?.unsafeMetadata?.address2 as string) || "",
      city: (user?.unsafeMetadata?.city as string) || "",
      state: (user?.unsafeMetadata?.state as string) || "",
      zip: (user?.unsafeMetadata?.zip as string) || "",
      skills: (user?.unsafeMetadata?.skills as string[]) || [],
      preferences: (user?.unsafeMetadata?.preferences as string) || "",
      availability: Array.isArray(user?.unsafeMetadata?.availability)
        ? (user.unsafeMetadata.availability as string[]).map((date) => new Date(date))
        : [],
    },
  })

  const onSubmit = async (data: RegistrationData) => {
    if (!user) return

    setLoading(true)

    try {
      // Clerk API: Store user profile in metadata
      await user.update({
        unsafeMetadata: {
          ...data,
          availability: data.availability.map((date) => date.toISOString()), // Store as ISO strings
          registrationComplete: true, // Mark registration as complete
        },
      })

      toast.success("Registration complete!")
      router.push("/volunteers") // Redirect to volunteer dashboard
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DashboardNav isAdmin={false} />
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Complete Your Registration</CardTitle>
            <CardDescription>Please provide your details to finish setting up your volunteer profile.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-4">
                <Label htmlFor="address1">Address 1</Label>
                <Input id="address1" {...register("address1")} />
                {errors.address1 && <p className="text-sm text-destructive">{errors.address1.message}</p>}
              </div>

              <div className="space-y-4">
                <Label htmlFor="address2">Address 2 (Optional)</Label>
                <Input id="address2" {...register("address2")} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} />
                  {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                          {stateOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">Zip Code</Label>
                <Input id="zip" {...register("zip")} />
                {errors.zip && <p className="text-sm text-destructive">{errors.zip.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange([...field.value, value])} value={field.value[0]}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your skills" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.skills && <p className="text-sm text-destructive">{errors.skills.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferences">Preferences (Optional)</Label>
                <Textarea id="preferences" {...register("preferences")} />
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Controller
                  name="availability"
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
                          {field.value?.length > 0 ? (
                            field.value.map((date) => format(date, "PPP")).join(", ")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="multiple" selected={field.value} onSelect={field.onChange} />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.availability && <p className="text-sm text-destructive">{errors.availability.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Complete Registration"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  )
}