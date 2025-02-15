import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardNav isAdmin={true} />
      {children}
    </>
  )
}