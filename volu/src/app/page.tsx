"use client"

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, Calendar, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/nav";

export default function HomePage() {
  const { user } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!user) return;

    setRedirecting(true);

    const role = user.publicMetadata?.role;

    if (role === "volunteer_admin") {
      router.push("/admin"); // ✅ Admins go directly to /admin
    } else if (role === "member" && !user.publicMetadata?.registrationComplete) {
      router.push("/registration"); // ✅ Volunteers must register first
    } else {
      router.push("/volunteers"); // ✅ Registered volunteers go to /volunteers
    }
  }, [user, router]);

  if (redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* Hero Section */}
      <section className="flex min-h-[100vh] flex-col items-center justify-center space-y-10 bg-gradient-to-b from-primary-50 to-white px-4 pt-20 text-center lg:pt-32">
        <div className="container flex flex-col items-center space-y-8">
          <div className="relative h-auto w-auto md:h-auto md:w-auto">
            <Image
              src="/Image (1).png"
              alt="VolU Hero Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-primary-900 sm:text-5xl md:text-6xl lg:text-7xl">
              Connect Volunteers with <span className="text-primary-600">Meaningful Opportunities</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              VolU helps non-profit organizations efficiently manage and match volunteers with events based on skills,
              location, and availability.
            </p>
          </div>

          {/* Show Sign Up button if user is signed out */}
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
                <span className="flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </SignUpButton>
          </SignedOut>

          {/* Show Dashboard button if user is signed in */}
          <SignedIn>
            {user?.publicMetadata?.role === "volunteer_admin" ? (
              <Button size="lg" asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/admin">Go to Admin Dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/volunteers">Go to Volunteer Dashboard</Link>
              </Button>
            )}
          </SignedIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-primary-50/50 py-20">
        <div className="container space-y-12">
          <h2 className="text-center text-3xl font-bold tracking-tighter text-primary-900 sm:text-4xl">Key Features</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: "Smart Matching",
                description: "Match volunteers to events based on skills, preferences, and availability",
              },
              {
                icon: Calendar,
                title: "Event Management",
                description: "Create and manage events with detailed requirements and schedules",
              },
              {
                icon: MapPin,
                title: "Location Based",
                description: "Find opportunities near you with our location-based matching system",
              },
              {
                icon: Award,
                title: "Track Progress",
                description: "Monitor volunteer participation and maintain detailed history",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="rounded-full bg-primary-100 p-3">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900">{feature.title}</h3>
                <p className="text-center text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="flex flex-col items-center space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-primary-900 sm:text-4xl">
            Ready to Make a Difference?
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground">
            Join VolU today and connect with meaningful volunteer opportunities in your community.
          </p>

          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
                Sign Up Now
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            {user?.publicMetadata?.role === "volunteer_admin" ? (
              <Button size="lg" asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/admin">Go to Admin Dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/volunteers">Go to Volunteer Dashboard</Link>
              </Button>
            )}
          </SignedIn>
        </div>
      </section>
    </div>
  );
}
