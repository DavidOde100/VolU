import { prisma } from "../db/client"
import { notificationService, NotificationType, NotificationPriority, NotificationChannel } from "./notificationService"

export enum ParticipationStatus {
  REGISTERED = "Registered",
  CONFIRMED = "Confirmed",
  ATTENDED = "Attended",
  NO_SHOW = "No-Show",
  CANCELLED = "Cancelled",
}

export interface ParticipationData {
  userId: string
  eventId: string
  status: ParticipationStatus
  role?: string
  hoursLogged?: number
  feedback?: string
  adminNotes?: string
  checkInTime?: Date
  checkOutTime?: Date
}

export const participationService = {
  /**
   * Create or update a participation record
   */
  recordParticipation: async (data: ParticipationData) => {
    const { userId, eventId, status, role, hoursLogged = 0, feedback, adminNotes, checkInTime, checkOutTime } = data

    // Check if a record already exists
    const existingRecord = await prisma.participationHistory.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    // Create or update the record
    const record = await prisma.participationHistory.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        status,
        ...(role !== undefined && { role }),
        ...(hoursLogged !== undefined && { hoursLogged }),
        ...(feedback !== undefined && { feedback }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(checkInTime !== undefined && { checkInTime }),
        ...(checkOutTime !== undefined && { checkOutTime }),
      },
      create: {
        userId,
        eventId,
        status,
        role: role || "",
        hoursLogged,
        hoursVerified: false,
        feedback,
        adminNotes,
        checkInTime,
        checkOutTime,
      },
    })

    // If this is a new status, send a notification
    if (!existingRecord || existingRecord.status !== status) {
      await participationService.sendStatusChangeNotification(record)
    }

    // Update volunteer impact metrics
    if (status === ParticipationStatus.ATTENDED) {
      await participationService.updateVolunteerImpact(userId, eventId, hoursLogged)
    }

    return record
  },

  /**
   * Get participation history for a volunteer
   */
  getVolunteerHistory: async (
    userId: string,
    options: {
      limit?: number
      offset?: number
      status?: ParticipationStatus
      startDate?: Date
      endDate?: Date
      sortBy?: string
      sortOrder?: "asc" | "desc"
    } = {},
  ) => {
    const { limit = 20, offset = 0, status, startDate, endDate, sortBy = "createdAt", sortOrder = "desc" } = options

    // Build the where clause
    const where: any = { userId }

    if (status) {
      where.status = status
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      where.event = {
        startDate: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }
    }

    // Get the participation history with event details
    const history = await prisma.participationHistory.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip: offset,
    })

    // Get the total count for pagination
    const totalCount = await prisma.participationHistory.count({ where })

    return {
      history,
      totalCount,
      limit,
      offset,
    }
  },

  /**
   * Get participation history for an event
   */
  getEventParticipationHistory: async (
    eventId: string,
    options: {
      limit?: number
      offset?: number
      status?: ParticipationStatus
      sortBy?: string
      sortOrder?: "asc" | "desc"
    } = {},
  ) => {
    const { limit = 20, offset = 0, status, sortBy = "createdAt", sortOrder = "desc" } = options

    // Build the where clause
    const where: any = { eventId }

    if (status) {
      where.status = status
    }

    // Get the participation history with user details
    const history = await prisma.participationHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip: offset,
    })

    // Get the total count for pagination
    const totalCount = await prisma.participationHistory.count({ where })

    return {
      history,
      totalCount,
      limit,
      offset,
    }
  },

  /**
   * Get all participation history (admin only)
   */
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
  ) => {
    const {
      limit = 20,
      offset = 0,
      userId,
      eventId,
      status,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options

    // Build the where clause
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (eventId) {
      where.eventId = eventId
    }

    if (status) {
      where.status = status
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      where.event = {
        startDate: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }
    }

    // Get the participation history with user and event details
    const history = await prisma.participationHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip: offset,
    })

    // Get the total count for pagination
    const totalCount = await prisma.participationHistory.count({ where })

    return {
      history,
      totalCount,
      limit,
      offset,
    }
  },

  /**
   * Verify volunteer hours (admin only)
   */
  verifyHours: async (participationId: string, verified: boolean, adminNotes?: string) => {
    const participation = await prisma.participationHistory.update({
      where: { id: participationId },
      data: {
        hoursVerified: verified,
        ...(adminNotes && { adminNotes }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Send notification to volunteer
    await notificationService.createNotification({
      userId: participation.userId,
      type: NotificationType.GENERAL_ANNOUNCEMENT,
      title: verified ? "Hours Verified" : "Hours Verification Update",
      message: verified
        ? `Your ${participation.hoursLogged} hours for "${participation.event.name}" have been verified.`
        : `There's an update regarding your hours for "${participation.event.name}". Please check your participation history.`,
      priority: NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      metadata: {
        participationId,
        eventId: participation.eventId,
        eventName: participation.event.name,
        hoursLogged: participation.hoursLogged,
        verified,
      },
    })

    return participation
  },

  /**
   * Check in a volunteer for an event
   */
  checkInVolunteer: async (userId: string, eventId: string, checkInTime: Date = new Date()) => {
    const participation = await participationService.recordParticipation({
      userId,
      eventId,
      status: ParticipationStatus.ATTENDED,
      checkInTime,
    })

    return participation
  },

  /**
   * Check out a volunteer from an event and log hours
   */
  checkOutVolunteer: async (userId: string, eventId: string, checkOutTime: Date = new Date()) => {
    // Get the existing record to calculate hours
    const existingRecord = await prisma.participationHistory.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    if (!existingRecord || !existingRecord.checkInTime) {
      throw new Error("Volunteer has not checked in for this event")
    }

    // Calculate hours based on check-in and check-out times
    const checkInTime = new Date(existingRecord.checkInTime)
    const hoursLogged = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

    // Round to nearest quarter hour
    const roundedHours = Math.round(hoursLogged * 4) / 4

    const participation = await participationService.recordParticipation({
      userId,
      eventId,
      status: ParticipationStatus.ATTENDED,
      hoursLogged: roundedHours,
      checkOutTime,
    })

    return participation
  },

  /**
   * Log feedback from a volunteer
   */
  logFeedback: async (userId: string, eventId: string, feedback: string) => {
    const participation = await participationService.recordParticipation({
      userId,
      eventId,
      status: ParticipationStatus.ATTENDED,
      feedback,
    })

    return participation
  },

  /**
   * Add admin notes to a participation record
   */
  addAdminNotes: async (participationId: string, adminNotes: string) => {
    const participation = await prisma.participationHistory.update({
      where: { id: participationId },
      data: { adminNotes },
    })

    return participation
  },

  /**
   * Get volunteer impact metrics
   */
  getVolunteerImpact: async (userId: string) => {
    // Get or create impact record
    let impact = await prisma.volunteerImpact.findUnique({
      where: { id: userId },
    })

    if (!impact) {
      impact = await prisma.volunteerImpact.create({
        data: {
          userId,
          totalHours: 0,
          eventsAttended: 0,
          skillsUtilized: [],
          causesSupported: [],
        },
      })
    }

    return impact
  },

  /**
   * Update volunteer impact metrics
   */
  updateVolunteerImpact: async (userId: string, eventId: string, hoursLogged: number) => {
    // Get the event details to update skills and causes
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        skills: true,
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

    // Extract skills and causes
    const skillsUtilized = event.skills.map((skill) => skill.name)
    const causesSupported = event.causes.map((cause) => cause.cause.name)

    // Get or create impact record
    let impact = await prisma.volunteerImpact.findUnique({
      where: { id: userId },
    })

    if (impact) {
      // Update existing record
      impact = await prisma.volunteerImpact.update({
        where: { id: userId },
        data: {
          totalHours: impact.totalHours + hoursLogged,
          eventsAttended: impact.eventsAttended + 1,
          skillsUtilized: [...new Set([...impact.skillsUtilized, ...skillsUtilized])],
          causesSupported: [...new Set([...impact.causesSupported, ...causesSupported])],
        },
      })
    } else {
      // Create new record
      impact = await prisma.volunteerImpact.create({
        data: {
          userId,
          totalHours: hoursLogged,
          eventsAttended: 1,
          skillsUtilized,
          causesSupported,
        },
      })
    }

    return impact
  },

  /**
   * Generate a volunteer certificate
   */
  generateCertificate: async (userId: string, eventId: string) => {
    // Get the participation record
    const participation = await prisma.participationHistory.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        event: true,
      },
    })

    if (!participation) {
      throw new Error("Participation record not found")
    }

    if (participation.status !== ParticipationStatus.ATTENDED) {
      throw new Error("Cannot generate certificate for non-attended event")
    }

    if (!participation.hoursVerified) {
      throw new Error("Hours must be verified before generating a certificate")
    }

    // Create a certificate
    const certificate = await prisma.volunteerAchievement.create({
      data: {
        userId,
        type: "Certificate",
        title: `Certificate of Participation - ${participation.event.name}`,
        description: `This certificate is awarded to recognize your ${participation.hoursLogged} hours of volunteer service at ${participation.event.name}.`,
        issuedAt: new Date(),
        metadata: {
          eventId,
          eventName: participation.event.name,
          hoursLogged: participation.hoursLogged,
          participationId: participation.id,
        },
      },
    })

    // Send notification to volunteer
    await notificationService.createNotification({
      userId,
      type: NotificationType.GENERAL_ANNOUNCEMENT,
      title: "Certificate Generated",
      message: `A certificate for your participation in "${participation.event.name}" has been generated.`,
      priority: NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      metadata: {
        certificateId: certificate.id,
        eventId,
        eventName: participation.event.name,
      },
    })

    return certificate
  },

  /**
   * Get volunteer certificates
   */
  getVolunteerCertificates: async (userId: string) => {
    const certificates = await prisma.volunteerAchievement.findMany({
      where: {
        userId,
        type: "Certificate",
      },
      orderBy: {
        issuedAt: "desc",
      },
    })

    return certificates
  },

  /**
   * Send notification when participation status changes
   */
  sendStatusChangeNotification: async (participation: any) => {
    const event = await prisma.event.findUnique({
      where: { id: participation.eventId },
      select: {
        id: true,
        name: true,
        startDate: true,
      },
    })

    if (!event) {
      return
    }

    let title = ""
    let message = ""
    let priority = NotificationPriority.MEDIUM

    switch (participation.status) {
      case ParticipationStatus.REGISTERED:
        title = "Registration Confirmed"
        message = `You have successfully registered for "${event.name}".`
        break
      case ParticipationStatus.CONFIRMED:
        title = "Participation Confirmed"
        message = `Your participation in "${event.name}" has been confirmed.`
        break
      case ParticipationStatus.ATTENDED:
        title = "Attendance Recorded"
        message = `Your attendance at "${event.name}" has been recorded.`
        break
      case ParticipationStatus.NO_SHOW:
        title = "Missed Event"
        message = `You were marked as a no-show for "${event.name}". If this is incorrect, please contact the event organizer.`
        priority = NotificationPriority.HIGH
        break
      case ParticipationStatus.CANCELLED:
        title = "Registration Cancelled"
        message = `Your registration for "${event.name}" has 
        title = "Registration Cancelled";
        message = \`Your registration for "${event.name}" has been cancelled.`
        priority = NotificationPriority.HIGH
        break
    }

    // Send notification to volunteer
    await notificationService.createNotification({
      userId: participation.userId,
      type: NotificationType.GENERAL_ANNOUNCEMENT,
      title,
      message,
      priority,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      metadata: {
        participationId: participation.id,
        eventId: event.id,
        eventName: event.name,
        status: participation.status,
      },
    })
  },

  /**
   * Get volunteer participation statistics
   */
  getVolunteerStatistics: async (userId: string) => {
    // Get total hours
    const totalHoursResult = await prisma.participationHistory.aggregate({
      where: {
        userId,
        status: ParticipationStatus.ATTENDED,
      },
      _sum: {
        hoursLogged: true,
      },
    })

    const totalHours = totalHoursResult._sum.hoursLogged || 0

    // Get event counts by status
    const eventCounts = await prisma.participationHistory.groupBy({
      by: ["status"],
      where: {
        userId,
      },
      _count: {
        status: true,
      },
    })

    // Convert to a more usable format
    const statusCounts: Record<string, number> = {}
    eventCounts.forEach((count) => {
      statusCounts[count.status] = count._count.status
    })

    // Get events by month (for charts)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const recentEvents = await prisma.participationHistory.findMany({
      where: {
        userId,
        status: ParticipationStatus.ATTENDED,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      include: {
        event: {
          select: {
            startDate: true,
          },
        },
      },
    })

    // Group by month
    const eventsByMonth: Record<string, number> = {}
    const hoursByMonth: Record<string, number> = {}

    recentEvents.forEach((event) => {
      const month = new Date(event.event.startDate).toLocaleString("default", { month: "short", year: "numeric" })

      if (!eventsByMonth[month]) {
        eventsByMonth[month] = 0
        hoursByMonth[month] = 0
      }

      eventsByMonth[month]++
      hoursByMonth[month] += event.hoursLogged
    })

    return {
      totalHours,
      statusCounts,
      eventsByMonth,
      hoursByMonth,
    }
  },
}

