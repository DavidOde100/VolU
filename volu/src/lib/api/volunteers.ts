import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db"; // your Prisma client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const volunteers = await db.user.findMany({
      where: { userType: "member" }, // Make sure 'userType' exists in your schema
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(200).json(
      volunteers.map((v) => ({
        id: v.id,
        fullName: v.name || "Unknown",
        email: v.email,
        joined: v.createdAt,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch volunteers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
