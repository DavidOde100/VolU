import axios from "axios"
import { z } from "zod"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Create an axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Event schema for validation
export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100, "Event name must be 100 characters or less"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be 2000 characters or less"),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Zip code must be 5 or 9 digits"),
  isVirtual: z.boolean().default(false),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().default("UTC"),
  maxVolunteers: z.number().int().positive().optional(),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
  eventType: z.string(),
  urgency: z.string(),
  causes: z.array(z.string()).min(1, "At least one cause is required"),
  images: z.array(z.string()).optional(),
  status: z.string().default("Active"),
})

export type EventFormData = z.infer<typeof eventSchema>
export type Event = EventFormData & {
  id: string
  createdBy: string
  createdAt: string
  updatedAt: string
  currentVolunteers: number
}

export const eventService = {
  // Get all events
  getAllEvents: async (): Promise<Event[]> => {
    try {
      const response = await api.get("/events")
      return response.data as Event[]
    } catch (error) {
      console.error("Error fetching events:", error)
      throw error
    }
  },

  // Get event by ID
  getEventById: async (id: string): Promise<Event> => {
    const res = await fetch(`/api/events/${id}`)
    if (!res.ok) throw new Error("Failed to fetch event")
    return await res.json()
  },

  // Create new event
  createEvent: async (eventData: EventFormData): Promise<Event> => {
    try {
      const response = await api.post("/events", eventData)
      return response.data as Event
    } catch (error) {
      console.error("Error creating event:", error)
      throw error
    }
  },

  // Update event
  updateEvent: async (eventId: string, eventData: Partial<EventFormData>): Promise<Event> => {
    try {
      const response = await api.put(`/events/${eventId}`, eventData)
      return response.data as Event
    } catch (error) {
      console.error(`Error updating event with ID ${eventId}:`, error)
      throw error
    }
  },

  // Delete event
  deleteEvent: async (eventId: string): Promise<void> => {
    try {
      await api.delete(`/events/${eventId}`)
    } catch (error) {
      console.error(`Error deleting event with ID ${eventId}:`, error)
      throw error
    }
  },

  // Register volunteer for event
  registerForEvent: async (eventId: string, userId: string): Promise<Event> => {
    try {
      const response = await api.post(`/events/${eventId}/register`, { userId })
      return response.data as Event
    } catch (error) {
      console.error(`Error registering for event with ID ${eventId}:`, error)
      throw error
    }
  },

  // Unregister volunteer from event
  unregisterFromEvent: async (eventId: string, userId: string): Promise<Event> => {
    try {
      const response = await api.post(`/events/${eventId}/unregister`, { userId })
      return response.data as Event
    } catch (error) {
      console.error(`Error unregistering from event with ID ${eventId}:`, error)
      throw error
    }
  },

  // Get events by user ID (events user volunteered for)
  getEventsByUserId: async (userId: string): Promise<Event[]> => {
    try {
      const response = await api.get(`/events/user/${userId}`)
      return response.data as Event[]
    } catch (error) {
      console.error(`Error fetching events for user with ID ${userId}:`, error)
      throw error
    }
  },

  // Get events created by user ID
  getEventsCreatedByUser: async (userId: string): Promise<Event[]> => {
    try {
      const response = await api.get(`/events/created-by/${userId}`)
      return response.data as Event[]
    } catch (error) {
      console.error(`Error fetching events created by user with ID ${userId}:`, error)
      throw error
    }
  },
}