import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Nav() {
  const { user } = useUser();

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative h-8 w-8">
            <Image src="/placeholder.svg?height=32&width=32" alt="VolU Logo" fill className="object-contain" priority />
          </div>
          <span className="text-xl font-bold text-primary-600">VolU</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary-600">
            About
          </Link>
          <Link href="/events" className="text-sm font-medium text-muted-foreground hover:text-primary-600">
            Events
          </Link>
          <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary-600">
            Contact
          </Link>
<<<<<<< HEAD
          <Link href="/VolunteeringMatchForm" className="text-sm font-medium text-muted-foreground hover:text-primary-600">
            Volunteer Matching
          </Link> {/* NEW TAB */}
          <Button asChild variant="ghost" className="text-sm font-medium">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="bg-primary-600 text-sm font-medium hover:bg-primary-700">
            <Link href="/register">Sign up</Link>
          </Button>
=======

          {/* Authentication Buttons */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" className="text-sm font-medium">Log in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-primary-600 text-sm font-medium hover:bg-primary-700">
                Sign up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            {user?.publicMetadata?.role === "admin" ? (
              <Button asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/volunteers">Volunteer Dashboard</Link>
              </Button>
            )}
          </SignedIn>
>>>>>>> 8c7dd4e (Save local changes before pulling updates)
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col space-y-4">
              <Link href="/about" className="text-sm font-medium hover:text-primary-600">
                About
              </Link>
              <Link href="/events" className="text-sm font-medium hover:text-primary-600">
                Events
              </Link>
              <Link href="/contact" className="text-sm font-medium hover:text-primary-600">
                Contact
              </Link>
<<<<<<< HEAD
              <Link href="/VolunteeringMatchForm" className="text-sm font-medium hover:text-primary-600">
                Volunteer Matching
              </Link> {/* NEW TAB */}
              <Button asChild variant="ghost" className="justify-start">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/register">Sign up</Link>
              </Button>
=======

              {/* Mobile Authentication */}
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" className="justify-start">Log in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-primary-600 hover:bg-primary-700">Sign up</Button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                {user?.publicMetadata?.role === "admin" ? (
                  <Button asChild className="bg-primary-600 hover:bg-primary-700">
                    <Link href="/admin">Admin Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild className="bg-primary-600 hover:bg-primary-700">
                    <Link href="/volunteers">Volunteer Dashboard</Link>
                  </Button>
                )}
              </SignedIn>
>>>>>>> 8c7dd4e (Save local changes before pulling updates)
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
