"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { user, isLoaded } = useUser();
  const { client } = useClerk();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (!isLoaded || !user) return;
    setIsSaving(true);
    try {
      await user.update({ firstName: fullName.split(" ")[0], lastName: fullName.split(" ").slice(1).join(" ") });
      toast.success("Name updated successfully!");
    } catch (err) {
      toast.error("Failed to update name.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      await user.setProfileImage({ file });
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={user?.imageUrl}
              alt="Profile"
              className="h-16 w-16 rounded-full object-cover"
            />
            <Input type="file" accept="image/*" onChange={handleProfilePhotoUpload} />
          </div>

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isLoaded}
            />
          </div>
          <Button onClick={handleSaveName} disabled={isSaving || !isLoaded}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email Notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive updates about volunteer activity and events.
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <Button
        variant="outline"
        onClick={() =>
            toast("Coming soon!", {
            description: "Password and profile editing will be available here.",
            })
        }
        >
        Change Password or Profile Settings
        </Button>
          <Button variant="destructive">Deactivate Account</Button>
        </CardContent>
      </Card>

      {/* API Key Management (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your developer access tokens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-gray-100 p-4 text-sm">
            <p className="font-mono">pk_test_1234abcd5678efgh</p>
          </div>
          <Button variant="outline">Generate New API Key</Button>
        </CardContent>
      </Card>
    </div>
  );
}
