"use client"

import Image from "next/image"
import Link from "next/link"
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Heart, Users, Lightbulb, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Nav } from "@/components/nav"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* Hero Section */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center space-y-10 bg-gradient-to-b from-primary-50 to-white px-4 pt-20 text-center lg:pt-32">
        <div className="container flex flex-col items-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-primary-900 sm:text-5xl md:text-6xl">
              About <span className="text-primary-600">VolU</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              Our mission is to connect passionate volunteers with meaningful opportunities that make a difference in
              communities.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="container py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tighter text-primary-900">Our Story</h2>
            <p className="text-muted-foreground">
              VolU was founded in 2023 with a simple but powerful vision: to create a platform that makes volunteering
              more accessible, efficient, and impactful.
            </p>
            <p className="text-muted-foreground">
              We recognized that while many people want to volunteer, finding the right opportunities that match their
              skills and availability can be challenging. Similarly, non-profit organizations often struggle to find
              qualified volunteers when they need them most.
            </p>
            <p className="text-muted-foreground">
              Our platform bridges this gap by using smart matching technology to connect volunteers with opportunities
              that align with their skills, interests, and schedule, while helping organizations efficiently manage
              their volunteer workforce.
            </p>
          </div>
          <div className="relative h-[400px] overflow-hidden rounded-lg">
            <Image
              src="/Image (1).png"
              alt="Volunteers working together"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-primary-50/50 py-20">
        <div className="container space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-primary-900">Our Values</h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground">
              These core principles guide everything we do at VolU
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Community Impact",
                description:
                  "We believe in the power of volunteering to transform communities and create lasting positive change.",
              },
              {
                icon: Users,
                title: "Inclusivity",
                description:
                  "We're committed to making volunteering accessible to everyone, regardless of background or experience level.",
              },
              {
                icon: Lightbulb,
                title: "Innovation",
                description: "We continuously improve our platform to better serve volunteers and organizations.",
              },
              {
                icon: Target,
                title: "Meaningful Engagement",
                description:
                  "We focus on creating valuable experiences that benefit both volunteers and the communities they serve.",
              },
              {
                icon: ArrowRight,
                title: "Efficiency",
                description:
                  "We streamline the volunteering process to maximize impact and minimize administrative burden.",
              },
              {
                icon: Users,
                title: "Collaboration",
                description:
                  "We foster partnerships between volunteers, organizations, and communities to achieve shared goals.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="rounded-full bg-primary-100 p-3">
                  <value.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900">{value.title}</h3>
                <p className="text-center text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container py-20">
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-primary-900">Our Team</h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground">
              Meet the passionate individuals behind VolU
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              {
                name: "David Odejimi",
                role: "Founder & CEO",
                image: "/David O.jpeg",
              },
              {
                name: "Afoma Ani",
                role: "Founder & CEO",
                image: "/Afoma Ani.jpeg",
              },
              {
                name: "Ayomide Aderohunmu",
                role: "Founder & CEO",
                image: "/Ayo Ade.jpeg",
              },
              {
                name: "Summer Lake",
                role: "Founder & CEO",
                image: "/Summer Lake.jpeg",
              },
            ].map((member, index) => (
              <div key={index} className="flex flex-col items-center space-y-4">
                <div className="relative h-48 w-48 overflow-hidden rounded-full">
                  <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-20 text-white">
        <div className="container flex flex-col items-center space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Make a Difference?</h2>
          <p className="mx-auto max-w-[600px]">
            Join VolU today and connect with meaningful volunteer opportunities in your community.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
          <SignUpButton mode="modal">
              <Button className="bg-muted text-black text-sm font-medium hover:bg-muted/80 px-6 py-3 rounded-md">
                Sign up
              </Button>
            </SignUpButton>
            <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-muted text-black hover:bg-muted/80"
                >
                <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
