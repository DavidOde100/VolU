import { clerkClient } from "@clerk/clerk-sdk-node"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { userId, publicMetadata } = req.body
  if (!userId || !publicMetadata) return res.status(400).json({ error: "Missing fields" })

  try {
    await clerkClient.users.updateUser(userId, { publicMetadata })
    res.status(200).json({ message: "Notification preferences updated" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update preferences" })
  }
}
