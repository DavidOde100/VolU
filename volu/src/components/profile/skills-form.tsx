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
import { MultiSelect } from "@/components/multi-select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// Skill options
const skillOptions = [
  { value: "event_planning", label: "Event Planning" },
  { value: "fundraising", label: "Fundraising" },
  { value: "public_speaking", label: "Public Speaking" },
  { value: "web_development", label: "Web Development" },
  { value: "marketing", label: "Marketing" },
  { value: "teaching", label: "Teaching" },
  { value: "mentoring", label: "Mentoring" },
  { value: "leadership", label: "Leadership" },
  { value: "project_management", label: "Project Management" },
  { value: "graphic_design", label: "Graphic Design" },
  { value: "social_media", label: "Social Media" },
  { value: "writing", label: "Writing" },
  { value: "photography", label: "Photography" },
  { value: "videography", label: "Videography" },
  { value: "cooking", label: "Cooking" },
  { value: "first_aid", label: "First Aid" },
  { value: "languages", label: "Foreign Languages" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "counseling", label: "Counseling" },
]

// Experience levels
const experienceLevels = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Intermediate" },
  { value: 3, label: "Advanced" },
  { value: 4, label: "Expert" },
]

const skillsSchema = z.object({
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  yearsExperience: z.number().min(0, "Years of experience must be at least 0"),
  experienceLevel: z.number().min(1).max(4),
  certifications: z.array(z.string()).optional(),
})

type SkillsFormValues = z.infer<typeof skillsSchema>

interface SkillsFormProps {
  user: any // ✅ Clerk's user object (removed incorrect import)
}

export function SkillsForm({ user }: SkillsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [certificationInput, setCertificationInput] = useState("")
  const [certifications, setCertifications] = useState<string[]>(
    (user?.publicMetadata?.certifications as string[]) || [],
  )

  const form = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills: (user?.publicMetadata?.skills as string[]) || [],
      yearsExperience: (user?.publicMetadata?.yearsExperience as number) || 0,
      experienceLevel: (user?.publicMetadata?.experienceLevel as number) || 1,
      certifications: (user?.publicMetadata?.certifications as string[]) || [],
    },
  })

  function addCertification() {
    if (certificationInput.trim() !== "") {
      const newCertifications = [...certifications, certificationInput.trim()]
      setCertifications(newCertifications)
      form.setValue("certifications", newCertifications)
      setCertificationInput("")
    }
  }

  function removeCertification(index: number) {
    const newCertifications = certifications.filter((_, i) => i !== index)
    setCertifications(newCertifications)
    form.setValue("certifications", newCertifications)
  }

  async function onSubmit(data: SkillsFormValues) {
    if (!user) {
      toast.error("User not found")
      return
    }

    setIsLoading(true)
    try {
      // ✅ Correct way to update user metadata in Clerk
      await user.update({
        publicMetadata: {
          skills: data.skills,
          yearsExperience: data.yearsExperience,
          experienceLevel: data.experienceLevel,
          certifications: data.certifications,
        },
      })
      toast.success("Skills updated successfully")
    } catch (error) {
      console.error("Error updating skills:", error)
      toast.error("Failed to update skills")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <MultiSelect
                  options={skillOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Select your skills"
                />
              </FormControl>
              <FormDescription>Select all skills that you can contribute as a volunteer</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="yearsExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experienceLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Level</FormLabel>
              <FormControl>
                <Slider
                  min={1}
                  max={4}
                  step={1}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
              </FormControl>
              <div className="flex justify-between">
                {experienceLevels.map((level) => (
                  <span key={level.value} className={field.value === level.value ? "font-bold" : ""}>
                    {level.label}
                  </span>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="certifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certifications</FormLabel>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  placeholder="Add certification"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCertification()
                    }
                  }}
                />
                <Button type="button" onClick={addCertification}>
                  Add
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary">
                    {cert}
                    <button
                      type="button"
                      className="ml-2"
                      onClick={() => removeCertification(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <FormDescription>Add any relevant certifications or training</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
}
