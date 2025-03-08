import { prisma } from "../db/client"
import { calculateDistance } from "../utils/locationUtils"

// Scoring weights for different matching criteria
const MATCH_WEIGHTS = {
  SKILLS: 0.35,
  LOCATION: 0.25,
  AVAILABILITY: 0.2,
  CAUSES: 0.15,
  PREFERENCES: 0.05,
}

// Interface for match result
export interface VolunteerMatch {
  volunteerId: string
  volunteerName: string
  volunteerEmail: string
  eventId: string
  eventName: string
  matchScore: number
  skillMatchPercentage: number
  locationMatchPercentage: number
  availabilityMatchPercentage: number
  causesMatchPercentage: number
  preferencesMatchPercentage: number
  matchDetails: {
    matchedSkills: string[]
    distance: number
    availabilityConflicts: string[]
    matchedCauses: string[]
    preferenceNotes: string[]
  }
}

export const matchingService = {
  /**
   * Find matches for a specific event
   */
  findMatchesForEvent: async (eventId: string): Promise<VolunteerMatch[]> => {
    // Get event details with required skills and causes
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        skills: {
          select: {
            name: true,
          },
        },
        causes: {
          include: {
            cause: true,
          },
        },
      },
    })

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    // Get all volunteers with their profiles, skills, availability, and preferences
    const volunteers = await prisma.user.findMany({
      include: { // ✅ Use "include" instead of "select" when fetching relations
        profile: true, // Includes full UserProfile
        skills: true, // Includes UserSkills
        settings: true, // Includes UserSettings
        availability: true, // Includes UserAvailability
        preference: {
          include: {
            causes: {
              include: {
                cause: true, // Ensures nested relation "cause" is included
              },
            },
          },
        },
      },
    })
    

    // Calculate match scores for each volunteer
    const matches: VolunteerMatch[] = []

    for (const volunteer of volunteers) {
      // Skip volunteers who are already registered for this event
      const isRegistered = await prisma.eventVolunteer.findFirst({
        where: {
          eventId: eventId,
          userId: volunteer.id,
        },
      })

      if (isRegistered) continue

      // Skip volunteers who have opted out of being matched (via settings)
      if (volunteer.settings?.profileVisibility === false) continue

      // Calculate skill match
      const skillMatch = calculateSkillMatch(
        volunteer.skills.map((s) => s.name),
        event.skills.map((s) => s.name),
      )

      // Calculate location match
      const locationMatch = await calculateLocationMatch(
        volunteer.profile,
        event,
        volunteer.preference?.preferredDistance,
      )

      // Calculate availability match
      const availabilityMatch = calculateAvailabilityMatch(volunteer.availability, event)

      // Calculate causes match
      const causesMatch = calculateCausesMatch(
        volunteer.preference?.causes.map((c) => c.cause.name) || [],
        event.causes.map((c) => c.cause.name),
      )

      // Calculate preferences match
      const preferencesMatch = calculatePreferencesMatch(volunteer.preference, event)

      // Calculate overall match score (weighted average)
      const overallScore =
        skillMatch.percentage * MATCH_WEIGHTS.SKILLS +
        locationMatch.percentage * MATCH_WEIGHTS.LOCATION +
        availabilityMatch.percentage * MATCH_WEIGHTS.AVAILABILITY +
        causesMatch.percentage * MATCH_WEIGHTS.CAUSES +
        preferencesMatch.percentage * MATCH_WEIGHTS.PREFERENCES

      // Only include volunteers with a minimum match score (e.g., 40%)
      if (overallScore >= 0.4) {
        matches.push({
          volunteerId: volunteer.id,
          volunteerName: volunteer.profile?.fullName || volunteer.name || "Unknown",
          volunteerEmail: volunteer.email,
          eventId: event.id,
          eventName: event.name,
          matchScore: overallScore,
          skillMatchPercentage: skillMatch.percentage,
          locationMatchPercentage: locationMatch.percentage,
          availabilityMatchPercentage: availabilityMatch.percentage,
          causesMatchPercentage: causesMatch.percentage,
          preferencesMatchPercentage: preferencesMatch.percentage,
          matchDetails: {
            matchedSkills: skillMatch.matchedSkills,
            distance: locationMatch.distance,
            availabilityConflicts: availabilityMatch.conflicts,
            matchedCauses: causesMatch.matchedCauses,
            preferenceNotes: preferencesMatch.notes,
          },
        })
      }
    }

    // Sort matches by overall score (descending)
    return matches.sort((a, b) => b.matchScore - a.matchScore)
  },

  /**
   * Find matches for a specific volunteer
   */
  findMatchesForVolunteer: async (volunteerId: string): Promise<VolunteerMatch[]> => {
    // Get volunteer details with skills, availability, and preferences
    const volunteer = await prisma.user.findUnique({
      where: { id: volunteerId },
      include: {
        profile: true,
        skills: true,
        availability: true,
        preference: {
          include: {
            causes: {
              include: {
                cause: true,
              },
            },
          },
        },
      },
    })

    if (!volunteer) {
      throw new Error(`Volunteer with ID ${volunteerId} not found`)
    }

    // Get all active events that the volunteer is not already registered for
    const events = await prisma.event.findMany({
      where: {
        status: "Active",
        maxVolunteers: {
          gt: 0,
        },
      },
      include: {
        skills: true,
        causes: {
          include: {
            cause: true,
          },
        },
      },
    })

    // Calculate match scores for each event
    const matches: VolunteerMatch[] = []

    for (const event of events) {
      // Calculate skill match
      const skillMatch = calculateSkillMatch(
        volunteer.skills.map((s) => s.name),
        event.skills.map((s) => s.name),
      )

      // Calculate location match
      const locationMatch = await calculateLocationMatch(
        volunteer.profile,
        event,
        volunteer.preference?.preferredDistance,
      )

      // Calculate availability match
      const availabilityMatch = calculateAvailabilityMatch(volunteer.availability, event)

      // Calculate causes match
      const causesMatch = calculateCausesMatch(
        volunteer.preference?.causes.map((c) => c.cause.name) || [],
        event.causes.map((c) => c.cause.name),
      )

      // Calculate preferences match
      const preferencesMatch = calculatePreferencesMatch(volunteer.preference, event)

      // Calculate overall match score (weighted average)
      const overallScore =
        skillMatch.percentage * MATCH_WEIGHTS.SKILLS +
        locationMatch.percentage * MATCH_WEIGHTS.LOCATION +
        availabilityMatch.percentage * MATCH_WEIGHTS.AVAILABILITY +
        causesMatch.percentage * MATCH_WEIGHTS.CAUSES +
        preferencesMatch.percentage * MATCH_WEIGHTS.PREFERENCES

      // Only include events with a minimum match score (e.g., 40%)
      if (overallScore >= 0.4) {
        matches.push({
          volunteerId: volunteer.id,
          volunteerName: volunteer.profile?.fullName || volunteer.name || "Unknown",
          volunteerEmail: volunteer.email,
          eventId: event.id,
          eventName: event.name,
          matchScore: overallScore,
          skillMatchPercentage: skillMatch.percentage,
          locationMatchPercentage: locationMatch.percentage,
          availabilityMatchPercentage: availabilityMatch.percentage,
          causesMatchPercentage: causesMatch.percentage,
          preferencesMatchPercentage: preferencesMatch.percentage,
          matchDetails: {
            matchedSkills: skillMatch.matchedSkills,
            distance: locationMatch.distance,
            availabilityConflicts: availabilityMatch.conflicts,
            matchedCauses: causesMatch.matchedCauses,
            preferenceNotes: preferencesMatch.notes,
          },
        })
      }
    }

    // Sort matches by overall score (descending)
    return matches.sort((a, b) => b.matchScore - a.matchScore)
  },

  /**
   * Invite a volunteer to an event
   */
  inviteVolunteerToEvent: async (eventId: string, volunteerId: string, message?: string) => {
    // Check if the volunteer is already invited
    const existingInvitation = await prisma.eventInvitation.findFirst({
      where: {
        eventId,
        userId: volunteerId,
      },
    })

    if (existingInvitation) {
      throw new Error("Volunteer has already been invited to this event")
    }

    // Create invitation
    const invitation = await prisma.eventInvitation.create({
      data: {
        eventId,
        userId: volunteerId,
        message: message || "You've been invited to volunteer for this event!",
        status: "Pending",
      },
    })

    return invitation
  },

  /**
   * Accept or decline an invitation
   */
  respondToInvitation: async (invitationId: string, accept: boolean) => {
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: invitationId },
      include: {
        event: true,
      },
    })

    if (!invitation) {
      throw new Error(`Invitation with ID ${invitationId} not found`)
    }

    if (invitation.status !== "Pending") {
      throw new Error(`Invitation has already been ${invitation.status.toLowerCase()}`)
    }

    if (accept) {
      // Check if the event is full
      if (invitation.event.maxVolunteers && invitation.event.currentVolunteers >= invitation.event.maxVolunteers) {
        throw new Error("This event is already full")
      }

      // Accept invitation and register volunteer for the event
      await prisma.$transaction([
        prisma.eventInvitation.update({
          where: { id: invitationId },
          data: { status: "Accepted" },
        }),
        prisma.event.update({
          where: { id: invitation.eventId },
          data: {
            maxVolunteers: {
              increment: 1,
            },
            currentVolunteers: {
              increment: 1,
            },
          },
        }),
      ])
    } else {
      // Decline invitation
      await prisma.eventInvitation.update({
        where: { id: invitationId },
        data: { status: "Declined" },
      })
    }

    return invitation
  },
}

/**
 * Calculate the match between volunteer skills and event required skills
 */
function calculateSkillMatch(volunteerSkills: string[], eventRequiredSkills: string[]) {
  if (eventRequiredSkills.length === 0) {
    return { percentage: 1, matchedSkills: volunteerSkills }
  }

  const matchedSkills = volunteerSkills.filter((skill) =>
    eventRequiredSkills.some((reqSkill) => reqSkill.toLowerCase() === skill.toLowerCase()),
  )

  const percentage = eventRequiredSkills.length > 0 ? matchedSkills.length / eventRequiredSkills.length : 0

  return {
    percentage,
    matchedSkills,
  }
}

/**
 * Calculate the match between volunteer location and event location
 */
async function calculateLocationMatch(volunteerProfile: any, event: any, preferredDistance?: string) {
  // For virtual events, location match is 100%
  if (event.isVirtual) {
    return { percentage: 1, distance: 0 }
  }

  // If volunteer has no location data, return low match
  if (!volunteerProfile || !volunteerProfile.city || !volunteerProfile.state || !volunteerProfile.zip) {
    return { percentage: 0.1, distance: 999 }
  }

  // Calculate distance between volunteer and event
  const volunteerLocation = `${volunteerProfile.address1}, ${volunteerProfile.city}, ${volunteerProfile.state} ${volunteerProfile.zip}`
  const eventLocation = `${event.address}, ${event.city}, ${event.state} ${event.zip}`

  // This would use a geocoding service in a real implementation
  // For now, we'll use a simplified distance calculation
  const distance = await calculateDistance(volunteerLocation, eventLocation)

  // Convert preferred distance to miles (default to 25 miles)
  const maxDistance = preferredDistance ? Number.parseInt(preferredDistance) : 25

  // Calculate percentage based on distance and preferred distance
  let percentage = 1 - distance / maxDistance

  // Ensure percentage is between 0 and 1
  percentage = Math.max(0, Math.min(1, percentage))

  return {
    percentage,
    distance,
  }
}

/**
 * Calculate the match between volunteer availability and event date/time
 */
function calculateAvailabilityMatch(volunteerAvailability: any, event: any) {
  if (!volunteerAvailability) {
    return { percentage: 0.5, conflicts: ["No availability data"] }
  }

  const conflicts: string[] = []
  let percentage = 1

  // Check if event date is in blackout dates
  if (volunteerAvailability.blackoutDates && volunteerAvailability.blackoutDates.length > 0) {
    const eventStartDate = new Date(event.startDate)
    const eventEndDate = new Date(event.endDate)

    const isBlackedOut = volunteerAvailability.blackoutDates.some((dateStr: string) => {
      const blackoutDate = new Date(dateStr)
      return (
        blackoutDate.getFullYear() === eventStartDate.getFullYear() &&
        blackoutDate.getMonth() === eventStartDate.getMonth() &&
        blackoutDate.getDate() === eventStartDate.getDate()
      )
    })

    if (isBlackedOut) {
      conflicts.push("Event date is in volunteer's blackout dates")
      percentage -= 0.5
    }
  }

  // Check if event day of week is in available days
  if (volunteerAvailability.availableDays && volunteerAvailability.availableDays.length > 0) {
    const eventStartDate = new Date(event.startDate)
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const eventDayOfWeek = daysOfWeek[eventStartDate.getDay()]

    if (!volunteerAvailability.availableDays.includes(eventDayOfWeek)) {
      conflicts.push(`Event is on ${eventDayOfWeek}, which is not in volunteer's available days`)
      percentage -= 0.3
    }
  }

  // Check if event time is in available time slots
  if (volunteerAvailability.availableTimeSlots && volunteerAvailability.availableTimeSlots.length > 0) {
    const eventStartHour = Number.parseInt(event.startTime.split(":")[0])

    let timeSlotMatch = false
    if (volunteerAvailability.availableTimeSlots.includes("morning") && eventStartHour >= 8 && eventStartHour < 12) {
      timeSlotMatch = true
    } else if (
      volunteerAvailability.availableTimeSlots.includes("afternoon") &&
      eventStartHour >= 12 &&
      eventStartHour < 17
    ) {
      timeSlotMatch = true
    } else if (
      volunteerAvailability.availableTimeSlots.includes("evening") &&
      eventStartHour >= 17 &&
      eventStartHour < 21
    ) {
      timeSlotMatch = true
    }

    if (!timeSlotMatch) {
      conflicts.push("Event time does not match volunteer's available time slots")
      percentage -= 0.2
    }
  }

  // Check notice period
  if (volunteerAvailability.minimumNoticePeriod) {
    const eventStartDate = new Date(event.startDate)
    const today = new Date()
    const daysUntilEvent = Math.floor((eventStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const minimumNoticeDays = Number.parseInt(volunteerAvailability.minimumNoticePeriod)

    if (daysUntilEvent < minimumNoticeDays) {
      conflicts.push(`Event is in ${daysUntilEvent} days, but volunteer requires ${minimumNoticeDays} days notice`)
      percentage -= 0.2
    }
  }

  // Ensure percentage is between 0 and 1
  percentage = Math.max(0, Math.min(1, percentage))

  return {
    percentage,
    conflicts,
  }
}

/**
 * Calculate the match between volunteer causes and event causes
 */
function calculateCausesMatch(volunteerCauses: string[], eventCauses: string[]) {
  if (eventCauses.length === 0 || volunteerCauses.length === 0) {
    return { percentage: 0.5, matchedCauses: [] }
  }

  const matchedCauses = volunteerCauses.filter((cause) =>
    eventCauses.some((eventCause) => eventCause.toLowerCase() === cause.toLowerCase()),
  )

  const percentage = matchedCauses.length / Math.max(volunteerCauses.length, 1)

  return {
    percentage,
    matchedCauses,
  }
}

/**
 * Calculate the match between volunteer preferences and event characteristics
 */
function calculatePreferencesMatch(volunteerPreferences: any, event: any) {
  if (!volunteerPreferences) {
    return { percentage: 0.5, notes: ["No preference data"] }
  }

  const notes: string[] = []
  let percentage = 1

  // Check remote preference
  if (volunteerPreferences.remoteOpportunities !== undefined) {
    if (volunteerPreferences.remoteOpportunities && !event.isVirtual) {
      notes.push("Volunteer prefers remote opportunities, but event is in-person")
      percentage -= 0.2
    }
  }

  // Check event type preference (frequency)
  if (volunteerPreferences.frequency) {
    const frequencyMatch =
      (volunteerPreferences.frequency === "one_time" && event.eventType === "one_time") ||
      (volunteerPreferences.frequency === "recurring" && event.eventType === "recurring") ||
      volunteerPreferences.frequency === "flexible"

    if (!frequencyMatch) {
      notes.push(`Volunteer prefers ${volunteerPreferences.frequency} events, but this is a ${event.eventType} event`)
      percentage -= 0.2
    }
  }

  // Ensure percentage is between 0 and 1
  percentage = Math.max(0, Math.min(1, percentage))

  return {
    percentage,
    notes,
  }
}