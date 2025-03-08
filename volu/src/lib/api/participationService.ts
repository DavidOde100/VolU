import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Create an axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export enum ParticipationStatus {
  REGISTERED = "Registered",
  CONFIRMED = "Confirmed",
  ATTENDED = "Attended",
  NO_SHOW = "No-Show",
  CANCELLED = "Cancelled",
}

export interface ParticipationRecord {
  id: string
  userId: string
  eventId: string
  status: ParticipationStatus
  role?: string
  hoursLogged: number
  hoursVerified: boolean
  feedback?: string
  adminNotes?: string
  checkInTime?: string
  checkOutTime?: string
  createdAt: string
  updatedAt: string
  event?: {
    id: string
    name: string
    description: string
    location: string
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
    status: string
  }
  user?: {
    id: string
    name?: string
    email: string
    profile?: {
      fullName: string
      phone?: string
    }
  }
}

export interface VolunteerImpact {
  id: string
  userId: string
  totalHours: number
  eventsAttended: number
  skillsUtilized: string[]
  causesSupported: string[]
  impactMetrics?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface VolunteerAchievement {
  id: string
  userId: string
  type: string
  title: string
  description?: string
  issuedAt: string
  expiresAt?: string
  imageUrl?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface VolunteerStatistics {
  totalHours: number
  statusCounts: Record<string, number>
  eventsByMonth: Record<string, number>
  hoursByMonth: Record<string, number>
}

export const participationService = {
  // Get participation history for the current user
  getMyHistory: async (
    options: {
      limit?: number
      offset?: number
      status?: ParticipationStatus
      startDate?: Date
      endDate?: Date
      sortBy?: string
      sortOrder?: "asc" | "desc"
    } = {},
  ): Promise<{
    history: ParticipationRecord[]
    totalCount: number
    limit: number
    offset: number
  }> => {
    try {
      const { limit, offset, status, startDate, endDate, sortBy, sortOrder } = options
      const params = new URLSearchParams()

      if (limit) params.append("limit", limit.toString())
      if (offset) params.append("offset", offset.toString())
      if (status) params.append("status", status)
      if (startDate) params.append("startDate", startDate.toISOString())
      if (endDate) params.append("endDate", endDate.toISOString())
      if (sortBy) params.append("sortBy", sortBy)
      if (sortOrder) params.append("sortOrder", sortOrder)

      const response = await api.get(`/participation/my-history?${params.toString()}`)
      return response.data as { history: ParticipationRecord[]; totalCount: number; limit: number; offset: number }
    } catch (error) {
      console.error("Error fetching participation history:", error)
      throw error
    }
  },

  // Get participation history for an event (admin only)
  getEventParticipationHistory: async (
    eventId: string,
    options: {
      limit?: number
      offset?: number
      status?: ParticipationStatus
      sortBy?: string
      sortOrder?: "asc" | "desc"
    } = {},
  ): Promise<{
    history: ParticipationRecord[]
    totalCount: number
    limit: number
    offset: number
  }> => {
    try {
      const { limit, offset, status, sortBy, sortOrder } = options
      const params = new URLSearchParams()

      if (limit) params.append("limit", limit.toString())
      if (offset) params.append("offset", offset.toString())
      if (status) params.append("status", status)
      if (sortBy) params.append("sortBy", sortBy)
      if (sortOrder) params.append("sortOrder", sortOrder)

      const response = await api.get(`/participation/event/${eventId}?${params.toString()}`)
      return response.data as { history: ParticipationRecord[]; totalCount: number; limit: number; offset: number }
    } catch (error) {
      console.error("Error fetching event participation history:", error)
      throw error
    }
  },

  // Get all participation history (admin only)
  getAllParticipationHistory: async (
    options: {
      limit?: number
      offset?: number
      userId?: string
      eventId?: string
      status?: ParticipationStatus
      startDate?: Date
      endDate?: Date
      sortBy?: string
      sortOrder?: "asc" | "desc"
    } = {},
  ): Promise<{
    history: ParticipationRecord[]
    totalCount: number
    limit: number
    offset: number
  }> => {
    try {
      const { limit, offset, userId, eventId, status, startDate, endDate, sortBy, sortOrder } = options
      const params = new URLSearchParams()

      if (limit) params.append("limit", limit.toString())
      if (offset) params.append("offset", offset.toString())
      if (userId) params.append("userId", userId)
      if (eventId) params.append("eventId", eventId)
      if (status) params.append("status", status)
      if (startDate) params.append("startDate", startDate.toISOString())
      if (endDate) params.append("endDate", endDate.toISOString())
      if (sortBy) params.append("sortBy", sortBy)
      if (sortOrder) params.append("sortOrder", sortOrder)

      const response = await api.get(`/participation/all?${params.toString()}`)
      return response.data as { history: ParticipationRecord[]; totalCount: number; limit: number; offset: number }
    } catch (error) {
      console.error("Error fetching all participation history:", error)
      throw error
    }
  },

  // Record participation
  recordParticipation: async (data: {
    userId: string
    eventId: string
    status: ParticipationStatus
    role?: string
    hoursLogged?: number
    feedback?: string
    adminNotes?: string
    checkInTime?: Date
    checkOutTime?: Date
  }): Promise<ParticipationRecord> => {
    try {
      const response = await api.post("/participation/record", data)
      return response.data as ParticipationRecord
    } catch (error) {
      console.error("Error recording participation:", error)
      throw error
    }
  },

  // Verify volunteer hours (admin only)
  verifyHours: async (
    participationId: string,
    verified: boolean,
    adminNotes?: string,
  ): Promise<ParticipationRecord> => {
    try {
      const response = await api.post(`/participation/${participationId}/verify`, { verified, adminNotes })
      return response.data as ParticipationRecord
    } catch (error) {
      console.error("Error verifying hours:", error)
      throw error
    }
  },

  // Check in a volunteer
  checkInVolunteer: async (userId: string, eventId: string, checkInTime?: Date): Promise<ParticipationRecord> => {
    try {
      const response = await api.post("/participation/check-in", { userId, eventId, checkInTime })
      return response.data as ParticipationRecord
    } catch (error) {
      console.error("Error checking in volunteer:", error)
      throw error
    }
  },

  // Check out a volunteer
  checkOutVolunteer: async (userId: string, eventId: string, checkOutTime?: Date): Promise<ParticipationRecord> => {
    try {
      const response = await api.post("/participation/check-out", { userId, eventId, checkOutTime })
      return response.data as ParticipationRecord
    } catch (error) {
      console.error("Error checking out volunteer:", error)
      throw error
    }
  },

  // Log feedback
  logFeedback: async (eventId: string, feedback: string): Promise<ParticipationRecord> => {
    try {
      const response = await api.post(`/participation/${eventId}/feedback`, { feedback })
      return response.data as ParticipationRecord
    } catch (error) {
      console.error("Error logging feedback:", error)
      throw error
    }
  },

  // Add admin notes (admin only)
  addAdminNotes: async (participationId: string, adminNotes: string): Promise<ParticipationRecord> => {
    try {
      const response = await api.post(`/participation/${participationId}/notes`, { adminNotes })
      return response.data as ParticipationRecord
    } catch (error) {
      console.error("Error adding admin notes:", error)
      throw error
    }
  },

  // Get volunteer impact metrics
  getVolunteerImpact: async (): Promise<VolunteerImpact> => {
    try {
      const response = await api.get("/participation/impact")
      return response.data as VolunteerImpact
    } catch (error) {
      console.error("Error fetching volunteer impact:", error)
      throw error
    }
  },

  // Get volunteer impact metrics for a specific user (admin only)
  getVolunteerImpactForUser: async (userId: string): Promise<VolunteerImpact> => {
    try {
      const response = await api.get(`/participation/impact/${userId}`)
      return response.data as VolunteerImpact
    } catch (error) {
      console.error("Error fetching volunteer impact:", error)
      throw error
    }
  },

  // Generate a volunteer certificate
  generateCertificate: async (eventId: string, userId?: string): Promise<VolunteerAchievement> => {
    try {
      const response = await api.post(`/participation/certificate/${eventId}`, { userId })
      return response.data as VolunteerAchievement
    } catch (error) {
      console.error("Error generating certificate:", error)
      throw error
    }
  },

  // Get volunteer certificates
  getVolunteerCertificates: async (): Promise<VolunteerAchievement[]> => {
    try {
      const response = await api.get("/participation/certificates")
      return response.data as VolunteerAchievement[]
    } catch (error) {
      console.error("Error fetching certificates:", error)
      throw error
    }
  },

  // Get volunteer certificates for a specific user (admin only)
  getVolunteerCertificatesForUser: async (userId: string): Promise<VolunteerAchievement[]> => {
      try {
        const response = await api.get(`/participation/certificates/${userId}`)
        return response.data as VolunteerAchievement[]
      } catch (error) {
        console.error("Error fetching certificates:", error)
        throw error
      }
    },

  // Get volunteer statistics
  getVolunteerStatistics: async (): Promise<VolunteerStatistics> => {
    try {
      const response = await api.get("/participation/statistics")
      return response.data as VolunteerStatistics
    } catch (error) {
      console.error("Error fetching volunteer statistics:", error)
      throw error
    }
  },

  // Get volunteer statistics for a specific user (admin only)
  getVolunteerStatisticsForUser: async (userId: string): Promise<VolunteerStatistics> => {
    try {
      const response = await api.get(`/participation/statistics/${userId}`)
      return response.data as VolunteerStatistics
    } catch (error) {
      console.error("Error fetching volunteer statistics:", error)
      throw error
    }
  },
}

