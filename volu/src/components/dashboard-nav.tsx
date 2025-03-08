"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, Users, Calendar, Settings, Menu, PlusCircle, UserCheck, History } from "lucide-react"
import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NotificationBell } from "@/components/notification-bell"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Volunteers",
    href: "/admin/volunteers",
    icon: Users,
  },
  {
    title: "Events",
    href: "/admin/events",
    icon: Calendar,
  },
  {
    title: "Create Event",
    href: "/admin/events/create",
    icon: PlusCircle,
  },
  {
    title: "Match Volunteers",
    href: "/admin/volunteer-matching",
    icon: UserCheck,
  },
  {
    title: "Volunteer History",
    href: "/admin/volunteer-history",
    icon: History,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

const volunteerNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/volunteers",
    icon: LayoutDashboard,
  },
  {
    title: "My Events",
    href: "/volunteers/events",
    icon: Calendar,
  },
  {
    title: "My History",
    href: "/volunteers/history",
    icon: History,
  },
  {
    title: "My Profile",
    href: "/volunteers/profile",
    icon: Settings,
  },
]

export function DashboardNav({ isAdmin = false }) {
  const pathname = usePathname()
  const items = isAdmin ? adminNavItems : volunteerNavItems

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">VolU {isAdmin ? "Admin" : "Volunteer"}</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60",
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <nav className="flex flex-col space-y-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-x-2 text-sm font-medium",
                    pathname === item.href ? "text-foreground" : "text-foreground/60",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <NotificationBell />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}

