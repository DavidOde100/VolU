import type { Request, Response, NextFunction } from "express"
import { clerkClient } from "@clerk/nextjs/server"
import { getAuth } from "@clerk/nextjs/server"

// Extend the Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string
        email: string
        isAdmin: boolean
      }
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the session and user from Clerk
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Get the user from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Check if the user is an admin
    const isAdmin = user.publicMetadata.role === "admin"

    // Add the user to the request
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      isAdmin,
    }

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res.status(401).json({ error: "Unauthorized" })
  }
}

