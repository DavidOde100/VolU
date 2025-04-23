"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Nav } from "@/components/nav"

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* Hero Section */}
      <section className="flex min-h-[40vh] flex-col items-center justify-center space-y-10 bg-gradient-to-b from-primary-50 to-white px-4 pt-20 text-center lg:pt-32">
        <div className="container flex flex-col items-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-primary-900 sm:text-5xl md:text-6xl">
              Contact <span className="text-primary-600">Us</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="container py-20">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact Form */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter text-primary-900">Get in Touch</h2>
              <p className="mt-2 text-muted-foreground">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>
            <form className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="first-name" className="text-sm font-medium">
                    First name
                  </label>
                  <Input id="first-name" placeholder="Enter your first name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last-name" className="text-sm font-medium">
                    Last name
                  </label>
                  <Input id="last-name" placeholder="Enter your last name" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" type="email" placeholder="Enter your email address" />
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Select>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="volunteer">Volunteer Question</SelectItem>
                    <SelectItem value="organization">Organization Partnership</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea id="message" placeholder="Enter your message" className="min-h-[150px]" />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter text-primary-900">Contact Information</h2>
              <p className="mt-2 text-muted-foreground">Here's how you can reach us directly or find our office.</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="mt-1 h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-muted-foreground">info@volu.org</p>
                  <p className="text-muted-foreground">support@volu.org</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="mt-1 h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-muted-foreground">(555) 123-4567</p>
                  <p className="text-muted-foreground">Mon-Fri, 9am-5pm EST</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="mt-1 h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="font-medium">Office</h3>
                  <p className="text-muted-foreground">123 Volunteer Street</p>
                  <p className="text-muted-foreground">Suite 456</p>
                  <p className="text-muted-foreground">Community City, ST 12345</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Clock className="mt-1 h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="font-medium">Hours</h3>
                  <p className="text-muted-foreground">Monday - Friday: 9am - 5pm</p>
                  <p className="text-muted-foreground">Saturday: 10am - 2pm</p>
                  <p className="text-muted-foreground">Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            {/* <div className="mt-8 h-[300px] rounded-lg bg-gray-200 flex items-center justify-center">
              <p className="text-muted-foreground">Map would be embedded here</p>
            </div> */}
          </div>
        </div>

            <div className="mt-8 h-[300px] rounded-lg overflow-hidden">
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11084.122712027952!2d-95.364695!3d29.760427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640bf1f41c04b9f%3A0xe2c74e5f8e0c5f78!2sDowntown%20Houston!5e0!3m2!1sen!2sus!4v1713821234567!5m2!1sen!2sus"
                width="100%"
                height="100%"
                allowFullScreen={true}
                loading="lazy"
                className="w-full h-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-primary-50/50 py-20">
        <div className="container space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-primary-900">Frequently Asked Questions</h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground">
              Find answers to common questions about VolU
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-6">
            {[
              {
                question: "How do I sign up as a volunteer?",
                answer:
                  "You can sign up by clicking the 'Sign Up' button on our homepage and following the registration process. Once registered, you can create your profile and start browsing volunteer opportunities.",
              },
              {
                question: "How does the matching system work?",
                answer:
                  "Our matching system uses your skills, interests, availability, and location to suggest volunteer opportunities that are a good fit for you. The more information you provide in your profile, the better matches we can find.",
              },
              {
                question: "I'm an organization. How can I post volunteer opportunities?",
                answer:
                  "Organizations need to register for an account and complete the verification process. Once verified, you can post volunteer opportunities and manage volunteer applications through your dashboard.",
              },
              {
                question: "Is there a cost to use VolU?",
                answer:
                  "VolU is free for individual volunteers. Organizations have free basic accounts with the option to upgrade to premium features for a monthly subscription fee.",
              },
              {
                question: "How do I track my volunteer hours?",
                answer:
                  "After completing a volunteer event, you can log your hours in your volunteer dashboard. Organizations can also verify these hours, which will appear on your volunteer history and impact report.",
              },
            ].map((faq, index) => (
              <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-primary-900">{faq.question}</h3>
                <p className="mt-2 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">
              Still have questions?{" "}
              <Link href="#" className="font-medium text-primary-600 hover:underline">
                Check our full FAQ page
              </Link>{" "}
              or{" "}
              <Link href="#" className="font-medium text-primary-600 hover:underline">
                contact our support team
              </Link>
              .
            </p>
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
          <SignUpButton mode="modal">
              <Button className="bg-muted text-black text-sm font-medium hover:bg-muted/80 px-6 py-3 rounded-md">
                Sign up
              </Button>
            </SignUpButton>
        </div>
      </section>
    </div>
  )
}
