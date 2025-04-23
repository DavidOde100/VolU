"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Clock, Users, Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Nav } from "@/components/nav"

// Mock event data
const events = [
  {
    id: "1",
    title: "Community Garden Clean-up",
    description:
      "Help us clean up and prepare the community garden for spring planting. Tools and refreshments provided.",
    image: "/Community Garden Clean-up.png",
    date: "May 15, 2023",
    time: "9:00 AM - 1:00 PM",
    location: "Central Community Garden",
    category: "Environment",
    spotsAvailable: 8,
    urgency: "medium",
  },
  {
    id: "2",
    title: "Food Bank Volunteer Day",
    description: "Sort and package food donations for distribution to families in need throughout the community.",
    image: "/Food Bank Volunteer Day.jpg",
    date: "May 20, 2023",
    time: "10:00 AM - 2:00 PM",
    location: "City Food Bank",
    category: "Hunger Relief",
    spotsAvailable: 12,
    urgency: "high",
  },
  {
    id: "3",
    title: "Youth Mentorship Program",
    description: "Mentor local youth in academic subjects and life skills. Training provided for all volunteers.",
    image: "/Youth Mentorship Program.jpg",
    date: "Ongoing",
    time: "Flexible Schedule",
    location: "Community Youth Center",
    category: "Education",
    spotsAvailable: 5,
    urgency: "medium",
  },
  {
    id: "4",
    title: "Senior Center Tech Help",
    description: "Assist seniors with technology questions, from smartphones to computers. All skill levels welcome.",
    image: "/Senior Center Tech Help.jpg",
    date: "Every Tuesday",
    time: "3:00 PM - 5:00 PM",
    location: "Sunshine Senior Living",
    category: "Seniors",
    spotsAvailable: 6,
    urgency: "low",
  },
  {
    id: "5",
    title: "Animal Shelter Assistant",
    description:
      "Help care for animals awaiting adoption, including walking dogs, socializing cats, and facility maintenance.",
    image: "/Animal Shelter Assistant.jpg",
    date: "Weekends",
    time: "Various Shifts",
    location: "Happy Paws Animal Shelter",
    category: "Animal Welfare",
    spotsAvailable: 4,
    urgency: "high",
  },
  {
    id: "6",
    title: "Neighborhood Cleanup Drive",
    description: "Join us for a day of cleaning up litter and beautifying our neighborhood streets and parks.",
    image: "/Neighborhood Cleanup Drive.avif",
    date: "June 5, 2023",
    time: "8:00 AM - 12:00 PM",
    location: "Westside Park",
    category: "Environment",
    spotsAvailable: 20,
    urgency: "medium",
  },
]

// Helper function to get badge variant based on urgency
const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case "low":
      return "secondary"
    case "medium":
      return "default"
    case "high":
      return "destructive"
    default:
      return "secondary"
  }
}

export default function EventsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* Hero Section */}
      <section className="flex min-h-[40vh] flex-col items-center justify-center space-y-10 bg-gradient-to-b from-primary-50 to-white px-4 pt-20 text-center lg:pt-32">
        <div className="container flex flex-col items-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-primary-900 sm:text-5xl md:text-6xl">
              Volunteer <span className="text-primary-600">Events</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              Browse and join upcoming volunteer opportunities in your community
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="container py-8">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Find Events</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search events..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="hunger">Hunger Relief</SelectItem>
                <SelectItem value="seniors">Seniors</SelectItem>
                <SelectItem value="animals">Animal Welfare</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="container py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                <div className="absolute right-2 top-2">
                  <Badge variant={getUrgencyBadge(event.urgency)}>
                    {event.urgency === "high" ? "Urgent Need" : event.urgency === "medium" ? "Needed Soon" : "Regular"}
                  </Badge>
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-xl font-semibold">{event.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{event.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-primary-600" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-primary-600" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-primary-600" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-primary-600" />
                    <span>{event.spotsAvailable} spots available</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <Badge variant="outline">{event.category}</Badge>
                  <Button asChild>
                    <Link href={`/events/${event.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Host an Event Section */}
      <section className="bg-primary-50/50 py-16">
        <div className="container">
          <div className="rounded-lg bg-white p-8 shadow-md md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter text-primary-900">Need Volunteers?</h2>
                <p className="text-muted-foreground">
                  If you're a non-profit organization or community group looking for volunteers, VolU can help you find
                  the right people with the skills you need.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/register">Register Organization</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/contact">Contact Us</Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-[300px] overflow-hidden rounded-lg">
                <Image
                  src="/houston-volunteer-organizations-opportunities-january-2024-target-hunger.jpg"
                  alt="Organization hosting volunteers"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="container py-20">
        <div className="rounded-lg bg-primary-600 p-8 text-white md:p-12">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Stay Updated on New Opportunities</h2>
            <p className="mx-auto max-w-[600px]">
              Subscribe to our newsletter to receive updates on new volunteer opportunities that match your interests.
            </p>
            <div className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
              <Input placeholder="Enter your email" className="bg-white text-primary-900" />
              <Button variant="secondary">Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
