"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PersonalInfoForm } from "@/components/profile/personal-info-form"
import { SkillsForm } from "@/components/profile/skills-form"
import { PreferencesForm } from "@/components/profile/preferences-form"
import { AvailabilityForm } from "@/components/profile/availability-form"
import { AccountSettingsForm } from "@/components/profile/account-settings-form"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState("personal")

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Available</CardTitle>
            <CardDescription>Please sign in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information, skills, and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>
                Manage your skills to help us match you with suitable volunteer opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkillsForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Volunteering Preferences</CardTitle>
              <CardDescription>Set your preferences for volunteer opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>Set your availability for volunteer opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountSettingsForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

