import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Create an axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export interface PersonalInfo {
  fullName: string
  phone?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  bio?: string
}

export interface Skill {
  name: string
}

export interface Certification {
  name: string
  issuer?: string
  issueDate?: string
  expiryDate?: string
}

export interface SkillsData {
  skills: string[]
  yearsExperience: number
  experienceLevel: number
  certifications?: Certification[]
}

export interface PreferencesData {
  causes: string[]
  preferredDistance: string
  frequency: string
  remoteOpportunities: boolean
  communicationPreference: string
  additionalPreferences?: string
}

export interface AvailabilityData {
  availableDays: string[]
  availableTimeSlots: string[]
  specificDates?: string[]
  blackoutDates?: string[]
  minimumNoticePeriod: string
  flexibleSchedule: boolean
}

export interface AccountSettingsData {
  emailNotifications: boolean
  emailFrequency: string
  smsNotifications: boolean
  profileVisibility: boolean
}

export const userProfileService = {
  // Get user profile
  getUserProfile: async (userId: string) => {
    try {
      const response = await api.get(`/user-profile/${userId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }
  },

  // Update personal information
  updatePersonalInfo: async (userId: string, data: PersonalInfo) => {
    try {
      const response = await api.put(`/user-profile/${userId}/personal-info`, data)
      return response.data
    } catch (error) {
      console.error("Error updating personal information:", error)
      throw error
    }
  },

  // Update skills
  updateSkills: async (userId: string, data: SkillsData) => {
    try {
      const response = await api.put(`/user-profile/${userId}/skills`, data)
      return response.data
    } catch (error) {
      console.error("Error updating skills:", error)
      throw error
    }
  },

  // Update preferences
  updatePreferences: async (userId: string, data: PreferencesData) => {
    try {
      const response = await api.put(`/user-profile/${userId}/preferences`, data)
      return response.data
    } catch (error) {
      console.error("Error updating preferences:", error)
      throw error
    }
  },

  // Update availability
  updateAvailability: async (userId: string, data: AvailabilityData) => {
    try {
      const response = await api.put(`/user-profile/${userId}/availability`, data)
      return response.data
    } catch (error) {
      console.error("Error updating availability:", error)
      throw error
    }
  },

  // Update account settings
  updateAccountSettings: async (userId: string, data: AccountSettingsData) => {
    try {
      const response = await api.put(`/user-profile/${userId}/account-settings`, data)
      return response.data
    } catch (error) {
      console.error("Error updating account settings:", error)
      throw error
    }
  },

  // Delete user account
  deleteUserAccount: async (userId: string) => {
    try {
      const response = await api.delete(`/user-profile/${userId}`)
      return response.data
    } catch (error) {
      console.error("Error deleting user account:", error)
      throw error
    }
  },
}

