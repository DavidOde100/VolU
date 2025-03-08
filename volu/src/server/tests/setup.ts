import type { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import { beforeEach, jest } from "@jest/globals";
import { prisma } from "../db/client";

// Mock the Prisma client
jest.mock("../db/client", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Properly typed Prisma mock instance
const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

// Define the NotificationService type
interface NotificationService {
  createNotification: (data: unknown) => Promise<unknown>;
}

// Mock the notification service with correct typing
jest.mock("../services/notificationService", () => ({
  notificationService: {
    createNotification: jest.fn<NotificationService["createNotification"]>().mockResolvedValue({}),
  },
  NotificationType: {
    GENERAL_ANNOUNCEMENT: "GENERAL_ANNOUNCEMENT",
  },
  NotificationPriority: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
  },
  NotificationChannel: {
    IN_APP: "IN_APP",
    EMAIL: "EMAIL",
    SMS: "SMS",
  },
}));

// Reset mocks before each test
beforeEach(() => {
  mockReset(mockPrisma);
});

export { mockPrisma };