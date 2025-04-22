import type { NextApiRequest, NextApiResponse } from "next"
import { clerkClient } from "@clerk/nextjs/server"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const { userId, publicMetadata } = req.body

  if (!userId || !publicMetadata) {
    return res.status(400).json({ error: "Missing userId or publicMetadata" })
  }

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, { publicMetadata })
    return res.status(200).json({ message: "Availability updated successfully" })
  } catch (error) {
    console.error("Error updating user metadata:", error)
    return res.status(500).json({ error: "Failed to update metadata" })
  }
}

