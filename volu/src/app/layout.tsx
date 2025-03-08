import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import type React from "react"

import { NotificationProvider } from "@/contexts/NotificationContext"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "VolU - Volunteer Management Platform",
  description: "Connect volunteers with meaningful opportunities",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <NotificationProvider>
            <div className="relative flex min-h-screen flex-col">{children}</div>
            <Toaster />
          </NotificationProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}