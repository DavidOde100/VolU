import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardNav isAdmin={false} />
      {children}
    </>
  )
}