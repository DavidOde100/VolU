import express from "express"
import request from "supertest"
import { participationService, ParticipationStatus } from "../../../services/participationService"
import participationRoutes from "../../../api/participation/routes"

// Mock the participation service
jest.mock("../../../services/participationService")
const mockParticipationService = participationService as jest.Mocked<typeof participationService>

// Mock the authentication middleware
jest.mock("../../../middleware/auth", () => ({
  authenticateUser: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.user = {
      id: "user-123",
      email: "user@example.com",
      isAdmin: req.headers["x-is-admin"] === "true",
    }
    next()
  },
}))

// Create a test app
const app = express()
app.use(express.json())
app.use("/api/participation", participationRoutes)

describe("Participation API Routes", () => {
  // Sample test data
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
    user: {
      id: userId,
      name: "Test User",
      email: "test@example.com",
      profile: {
        fullName: "Test User",
        phone: null,
      },
    },
    event: {
      id: eventId,
      name: "Test Event",
      description: "A test event for volunteers.",
      location: "123 Main St, Houston, TX",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "10:00 AM",
      endTime: "2:00 PM",
      status: "Active",
    },
  }

  describe("GET /my-history", () => {
    it("should return the user's participation history", async () => {
      // Mock data
      const mockResult = {
        history: [mockParticipation],
        totalCount: 1,
        limit: 20,
        offset: 0,
      }

      // Mock the service method
      mockParticipationService.getVolunteerHistory.mockResolvedValue(mockResult)

      // Make the request
      const response = await request(app).get("/api/participation/my-history")

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResult)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getVolunteerHistory).toHaveBeenCalledWith(userId, {
        limit: undefined,
        offset: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it("should apply query parameters correctly", async () => {
      // Mock data
      const mockResult = {
        history: [mockParticipation],
        totalCount: 1,
        limit: 10,
        offset: 5,
      }

      // Mock the service method
      mockParticipationService.getVolunteerHistory.mockResolvedValue(mockResult)

      // Make the request
      const response = await request(app).get("/api/participation/my-history").query({
        limit: "10",
        offset: "5",
        status: ParticipationStatus.ATTENDED,
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        sortBy: "hoursLogged",
        sortOrder: "asc",
      })

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResult)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getVolunteerHistory).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 5,
        status: ParticipationStatus.ATTENDED,
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-12-31"),
        sortBy: "hoursLogged",
        sortOrder: "asc",
      })
    })
  })

  describe("GET /event/:eventId", () => {
    it("should return the event's participation history for an admin", async () => {
      // Mock data
      const mockResult = {
        history: [mockParticipation],
        totalCount: 1,
        limit: 20,
        offset: 0,
      }

      // Mock the prisma findUnique method
      const { prisma } = require("../../../db/client")
      prisma.event.findUnique.mockResolvedValue({ id: eventId, createdBy: "admin-123" })

      // Mock the service method
      mockParticipationService.getEventParticipationHistory.mockResolvedValue(mockResult)

      // Make the request
      const response = await request(app).get(`/api/participation/event/${eventId}`).set("x-is-admin", "true")

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResult)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getEventParticipationHistory).toHaveBeenCalledWith(eventId, {
        limit: undefined,
        offset: undefined,
        status: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it("should return 403 for a non-admin who is not the event creator", async () => {
      // Mock the prisma findUnique method
      const { prisma } = require("../../../db/client")
      prisma.event.findUnique.mockResolvedValue({ id: eventId, createdBy: "other-user" })

      // Make the request
      const response = await request(app).get(`/api/participation/event/${eventId}`)

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to view this event's participation history")
    })
  })

  describe("GET /all", () => {
    it("should return all participation history for an admin", async () => {
      // Mock data
      const mockResult = {
        history: [mockParticipation],
        totalCount: 1,
        limit: 20,
        offset: 0,
      }

      // Mock the service method
      mockParticipationService.getAllParticipationHistory.mockResolvedValue(mockResult)

      // Make the request
      const response = await request(app).get("/api/participation/all").set("x-is-admin", "true")

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResult)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getAllParticipationHistory).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
        userId: undefined,
        eventId: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it("should return 403 for a non-admin", async () => {
      // Make the request
      const response = await request(app).get("/api/participation/all")

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to view all participation history")
    })
  })

  describe("POST /record", () => {
    it("should record participation for the current user", async () => {
      // Mock the service method
      mockParticipationService.recordParticipation.mockResolvedValue(mockParticipation)

      // Make the request
      const response = await request(app).post("/api/participation/record").send({
        userId,
        eventId,
        status: ParticipationStatus.REGISTERED,
      })

      // Verify the response
      expect(response.status).toBe(201)
      expect(response.body).toEqual(mockParticipation)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.recordParticipation).toHaveBeenCalledWith({
        userId,
        eventId,
        status: ParticipationStatus.REGISTERED,
      })
    })

    it("should return 403 when trying to record for another user as a non-admin", async () => {
      // Make the request
      const response = await request(app).post("/api/participation/record").send({
        userId: "other-user",
        eventId,
        status: ParticipationStatus.REGISTERED,
      })

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to record participation for this user")
    })

    it("should allow an admin to record participation for another user", async () => {
      // Mock the service method
      mockParticipationService.recordParticipation.mockResolvedValue({
        ...mockParticipation,
        userId: "other-user",
      })

      // Make the request
      const response = await request(app).post("/api/participation/record").set("x-is-admin", "true").send({
        userId: "other-user",
        eventId,
        status: ParticipationStatus.REGISTERED,
      })

      // Verify the response
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("userId", "other-user")
    })

    it("should return 403 when a non-admin tries to set a restricted status", async () => {
      // Make the request
      const response = await request(app).post("/api/participation/record").send({
        userId,
        eventId,
        status: ParticipationStatus.CONFIRMED, // Only admins can set this
      })

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to set this participation status")
    })
  })

  describe("POST /:participationId/verify", () => {
    it("should verify hours for an admin", async () => {
      // Mock the service method
      mockParticipationService.verifyHours.mockResolvedValue({
        ...mockParticipation,
        hoursVerified: true,
      })

      // Make the request
      const response = await request(app)
        .post(`/api/participation/${participationId}/verify`)
        .set("x-is-admin", "true")
        .send({
          verified: true,
          adminNotes: "Hours verified",
        })

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("hoursVerified", true)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.verifyHours).toHaveBeenCalledWith(participationId, true, "Hours verified")
    })

    it("should return 403 for a non-admin", async () => {
      // Make the request
      const response = await request(app).post(`/api/participation/${participationId}/verify`).send({
        verified: true,
      })

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to verify volunteer hours")
    })
  })

  describe("POST /check-in", () => {
    it("should check in the current user", async () => {
      // Mock the service method
      mockParticipationService.checkInVolunteer.mockResolvedValue({
        ...mockParticipation,
        status: ParticipationStatus.ATTENDED,
        checkInTime: new Date(),
      })

      // Make the request
      const response = await request(app).post("/api/participation/check-in").send({
        userId,
        eventId,
      })

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("status", ParticipationStatus.ATTENDED)
      expect(response.body).toHaveProperty("checkInTime")

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.checkInVolunteer).toHaveBeenCalledWith(userId, eventId, undefined)
    })

    it("should return 403 when trying to check in another user as a non-admin", async () => {
      // Make the request
      const response = await request(app).post("/api/participation/check-in").send({
        userId: "other-user",
        eventId,
      })

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to check in this user")
    })
  })

  describe("POST /check-out", () => {
    it("should check out the current user", async () => {
      // Mock the service method
      mockParticipationService.checkOutVolunteer.mockResolvedValue({
        ...mockParticipation,
        status: ParticipationStatus.ATTENDED,
        checkInTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        checkOutTime: new Date(),
        hoursLogged: 4,
      })

      // Make the request
      const response = await request(app).post("/api/participation/check-out").send({
        userId,
        eventId,
      })

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("status", ParticipationStatus.ATTENDED)
      expect(response.body).toHaveProperty("checkOutTime")
      expect(response.body).toHaveProperty("hoursLogged", 4)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.checkOutVolunteer).toHaveBeenCalledWith(userId, eventId, undefined)
    })

    it("should return 403 when trying to check out another user as a non-admin", async () => {
      // Make the request
      const response = await request(app).post("/api/participation/check-out").send({
        userId: "other-user",
        eventId,
      })

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to check out this user")
    })
  })

  describe("POST /:eventId/feedback", () => {
    it("should log feedback for an event", async () => {
      // Mock the service method
      mockParticipationService.logFeedback.mockResolvedValue({
        ...mockParticipation,
        feedback: "Great event!",
      })

      // Make the request
      const response = await request(app).post(`/api/participation/${eventId}/feedback`).send({
        feedback: "Great event!",
      })

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("feedback", "Great event!")

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.logFeedback).toHaveBeenCalledWith(userId, eventId, "Great event!")
    })

    it("should return 400 for empty feedback", async () => {
      // Make the request
      const response = await request(app).post(`/api/participation/${eventId}/feedback`).send({
        feedback: "",
      })

      // Verify the response
      expect(response.status).toBe(400)
    })
  })

  describe("GET /impact", () => {
    it("should return the current user's impact metrics", async () => {
      // Mock data
      const mockImpact = {
        id: "impact-123", // Add ID
        createdAt: new Date(), // Add createdAt timestamp
        updatedAt: new Date(), // Add updatedAt timestamp
        userId, // Already present
        totalHours: 10,
        eventsAttended: 3,
        skillsUtilized: ["Leadership", "Communication"],
        causesSupported: ["Education", "Environment"],
        impactMetrics: {}, // Mock impactMetrics as an empty JSON object (adjust if necessary)
      }

      // Mock the service method
      mockParticipationService.getVolunteerImpact.mockResolvedValue(mockImpact)

      // Make the request
      const response = await request(app).get("/api/participation/impact")

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockImpact)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getVolunteerImpact).toHaveBeenCalledWith(userId)
    })
  })

  describe("GET /impact/:userId", () => {
    it("should return impact metrics for another user as an admin", async () => {
      // Mock data
      const targetUserId = "other-user"
      const mockImpact = {
        id: "impact-123", // Add ID
        createdAt: new Date(), // Add createdAt timestamp
        updatedAt: new Date(), // Add updatedAt timestamp
        userId, // Already present
        totalHours: 10,
        eventsAttended: 3,
        skillsUtilized: ["Leadership", "Communication"],
        causesSupported: ["Education", "Environment"],
        impactMetrics: {}, // Mock impactMetrics as an empty JSON object (adjust if necessary)
      }

      // Mock the service method
      mockParticipationService.getVolunteerImpact.mockResolvedValue(mockImpact)

      // Make the request
      const response = await request(app).get(`/api/participation/impact/${targetUserId}`).set("x-is-admin", "true")

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockImpact)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getVolunteerImpact).toHaveBeenCalledWith(targetUserId)
    })

    it("should return 403 when trying to view impact metrics for another user as a non-admin", async () => {
      // Make the request
      const response = await request(app).get("/api/participation/impact/other-user")

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to view impact metrics for this user")
    })
  })

  describe("POST /certificate/:eventId", () => {
    it("should generate a certificate for the current user", async () => {
      // Mock data
      const mockCertificate = {
        id: "cert-123",
        userId,
        type: "Certificate",
        title: "Certificate of Participation - Test Event",
        description: "This certificate is awarded to recognize your 4 hours of volunteer service at Test Event.",
        issuedAt: new Date(),
        expiresAt: null, // Ensure null is explicitly defined
        imageUrl: null,  // Ensure null is explicitly defined
        metadata: {
          eventId,
          eventName: "Test Event",
          hoursLogged: 4,
          participationId,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock the service method
      mockParticipationService.generateCertificate.mockResolvedValue(mockCertificate)

      // Make the request
      const response = await request(app).post(`/api/participation/certificate/${eventId}`)

      // Verify the response
      expect(response.status).toBe(201)
      expect(response.body).toEqual(mockCertificate)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.generateCertificate).toHaveBeenCalledWith(userId, eventId)
    })

    it("should allow an admin to generate a certificate for another user", async () => {
      // Mock data
      const targetUserId = "other-user"
      const mockCertificate = {
        id: "cert-123",
        userId,
        type: "Certificate",
        title: "Certificate of Participation - Test Event",
        description: "This certificate is awarded to recognize your 4 hours of volunteer service at Test Event.",
        issuedAt: new Date(),
        expiresAt: null, // Ensure null is explicitly defined
        imageUrl: null,  // Ensure null is explicitly defined
        metadata: {
          eventId,
          eventName: "Test Event",
          hoursLogged: 4,
          participationId,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock the service method
      mockParticipationService.generateCertificate.mockResolvedValue(mockCertificate)

      // Make the request
      const response = await request(app)
        .post(`/api/participation/certificate/${eventId}`)
        .set("x-is-admin", "true")
        .send({
          userId: targetUserId,
        })

      // Verify the response
      expect(response.status).toBe(201)
      expect(response.body).toEqual(mockCertificate)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.generateCertificate).toHaveBeenCalledWith(targetUserId, eventId)
    })

    it("should return 403 when trying to generate a certificate for another user as a non-admin", async () => {
      // Make the request
      const response = await request(app).post(`/api/participation/certificate/${eventId}`).send({
        userId: "other-user",
      })

      // Verify the response
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty("error", "Unauthorized to generate certificate for this user")
    })
  })

  describe("GET /certificates", () => {
    it("should return the current user's certificates", async () => {
      // Mock data
      const mockCertificates = [
        {
          id: "cert-123",
          userId,
          type: "Certificate",
          title: "Certificate of Participation - Test Event",
          description: "This certificate is awarded to recognize your 4 hours of volunteer service at Test Event.",
          issuedAt: new Date(),
          createdAt: new Date(), // Add createdAt timestamp
          updatedAt: new Date(), // Add updatedAt timestamp
          expiresAt: null, // Assuming certificates don’t expire, set to null
          imageUrl: null, // If certificates have an image URL, set it; otherwise, keep null
          metadata: JSON.stringify({ // Convert to JSON-serializable format
            eventId,
            eventName: "Test Event",
            hoursLogged: 4,
            participationId,
          }),
        },
      ]

      // Mock the service method
      mockParticipationService.getVolunteerCertificates.mockResolvedValue(mockCertificates)

      // Make the request
      const response = await request(app).get("/api/participation/certificates")

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockCertificates)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getVolunteerCertificates).toHaveBeenCalledWith(userId)
    })
  })

  describe("GET /statistics", () => {
    it("should return the current user's statistics", async () => {
      // Mock data
      const mockStatistics = {
        totalHours: 10,
        statusCounts: {
          [ParticipationStatus.REGISTERED]: 5,
          [ParticipationStatus.ATTENDED]: 3,
        },
        eventsByMonth: {
          "Jan 2023": 1,
          "Feb 2023": 2,
        },
        hoursByMonth: {
          "Jan 2023": 4,
          "Feb 2023": 6,
        },
      }

      // Mock the service method
      mockParticipationService.getVolunteerStatistics.mockResolvedValue(mockStatistics)

      // Make the request
      const response = await request(app).get("/api/participation/statistics")

      // Verify the response
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockStatistics)

      // Verify that the service method was called with the correct parameters
      expect(mockParticipationService.getVolunteerStatistics).toHaveBeenCalledWith(userId)
    })
  })
})