import { jest } from "@jest/globals"
import { prisma } from "../../db/client"
import { participationService, ParticipationStatus } from "../../services/participationService"
import { notificationService } from "../../services/notificationService"

// Mock the prisma client
jest.mock("../../db/client", () => ({
  prisma: {
    participationHistory: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    volunteerImpact: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    volunteerAchievement: {
      create: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock("../../services/notificationService", () => ({
  notificationService: {
    createNotification: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("Participation Service", () => {
  const userId = "user-123"
  const eventId = "event-456"
  const participationId = "participation-789"

  const mockParticipation = {
    id: participationId,
    userId,
    eventId,
    status: ParticipationStatus.REGISTERED,
    role: "",
    hoursLogged: 0,
    hoursVerified: false,
    feedback: null,
    adminNotes: null,
    checkInTime: null,
    checkOutTime: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockEvent = {
    id: eventId,
    name: "Test Event",
    description: "Test Description",
    location: "Test Location",
    startDate: new Date(),
    endDate: new Date(),
    startTime: "09:00",
    endTime: "17:00",
    status: "ACTIVE",
    createdBy: "admin-123",
    skills: [{ name: "Leadership" }, { name: "Communication" }],
    causes: [{ cause: { name: "Education" } }, { cause: { name: "Environment" } }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("recordParticipation", () => {
    it("should create a new participation record if one does not exist", async () => {
      jest.mocked(mockPrisma.participationHistory.findUnique).mockResolvedValue(null)
      jest.mocked(mockPrisma.participationHistory.upsert).mockResolvedValue(mockParticipation)

      const result = await participationService.recordParticipation({
        userId,
        eventId,
        status: ParticipationStatus.REGISTERED,
      })

      expect(result).toEqual(mockParticipation)
      expect(mockPrisma.participationHistory.upsert).toHaveBeenCalled()
    })

    it("should update an existing participation record", async () => {
      jest.mocked(mockPrisma.participationHistory.findUnique).mockResolvedValue(mockParticipation)
      const updatedParticipation = { ...mockParticipation, status: ParticipationStatus.CONFIRMED }
      jest.mocked(mockPrisma.participationHistory.upsert).mockResolvedValue(updatedParticipation)

      const result = await participationService.recordParticipation({
        userId,
        eventId,
        status: ParticipationStatus.CONFIRMED,
      })

      expect(result).toEqual(updatedParticipation)
      expect(mockPrisma.participationHistory.upsert).toHaveBeenCalled()
    })
  })

  describe("getVolunteerHistory", () => {
    it("should return volunteer participation history", async () => {
      const mockHistory = [{ ...mockParticipation, event: mockEvent }]
      jest.mocked(mockPrisma.participationHistory.findMany).mockResolvedValue(mockHistory)
      jest.mocked(mockPrisma.participationHistory.count).mockResolvedValue(1)

      const result = await participationService.getVolunteerHistory(userId)

      expect(result).toEqual({
        history: mockHistory,
        totalCount: 1,
        limit: 20,
        offset: 0,
      })
      expect(mockPrisma.participationHistory.findMany).toHaveBeenCalled()
    })
  })

  describe("verifyHours", () => {
    it("should verify volunteer hours and send a notification", async () => {
      const updatedParticipation = { ...mockParticipation, hoursVerified: true }
      jest.mocked(mockPrisma.participationHistory.update).mockResolvedValue(updatedParticipation)

      const result = await participationService.verifyHours(participationId, true, "Hours verified")

      expect(result).toEqual(updatedParticipation)
      expect(mockPrisma.participationHistory.update).toHaveBeenCalled()
      expect(notificationService.createNotification).toHaveBeenCalled()
    })
  })

  describe("getVolunteerImpact", () => {
    it("should return existing impact record", async () => {
      const mockImpact = {
        id: "impact-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        totalHours: 10,
        eventsAttended: 3,
        skillsUtilized: ["Leadership", "Communication"],
        causesSupported: ["Education", "Environment"],
        impactMetrics: {},
      }

      jest.mocked(mockPrisma.volunteerImpact.findUnique).mockResolvedValue(mockImpact)

      const result = await participationService.getVolunteerImpact(userId)

      expect(result).toEqual(mockImpact)
      expect(mockPrisma.volunteerImpact.findUnique).toHaveBeenCalled()
    })
  })

  describe("generateCertificate", () => {
    it("should generate a certificate for a verified participation", async () => {
      const participation = {
        ...mockParticipation,
        status: ParticipationStatus.ATTENDED,
        hoursVerified: true,
        hoursLogged: 4,
        event: mockEvent,
      }

      const certificate = {
        id: "cert-123",
        userId,
        type: "Certificate",
        title: `Certificate of Participation - ${mockEvent.name}`,
        description: `This certificate is awarded to recognize your 4 hours of volunteer service at ${mockEvent.name}.`,
        issuedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
        imageUrl: null,
        metadata: {
          eventId,
          eventName: mockEvent.name,
          hoursLogged: 4,
          participationId,
        },
      }

      jest.mocked(mockPrisma.participationHistory.findUnique).mockResolvedValue(participation)
      jest.mocked(mockPrisma.volunteerAchievement.create).mockResolvedValue(certificate)

      const result = await participationService.generateCertificate(userId, eventId)

      expect(result).toEqual(certificate)
      expect(mockPrisma.volunteerAchievement.create).toHaveBeenCalled()
      expect(notificationService.createNotification).toHaveBeenCalled()
    })

    it("should throw an error if hours are not verified", async () => {
      const participation = { ...mockParticipation, hoursVerified: false, event: mockEvent }
      jest.mocked(mockPrisma.participationHistory.findUnique).mockResolvedValue(participation)

      await expect(participationService.generateCertificate(userId, eventId)).rejects.toThrow(
        "Hours must be verified before generating a certificate"
      )
    })
  })
})
