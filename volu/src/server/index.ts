import express from "express"
import cors from "cors"
import { json } from "body-parser"
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node"

import userProfileRoutes from "./api/user-profile/routes"
import eventRoutes from "./api/events/routes"
import matchingRoutes from "./api/matching/routes"
import notificationRoutes from "./api/notifications/routes"
import participationRoutes from "./api/participation/routes"
import "./cron" // Import cron jobs

const app = express()

// Middleware
app.use(cors())
app.use(json())
app.use(ClerkExpressWithAuth())

// Routes
app.use("/api/user-profile", userProfileRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/matching", matchingRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/participation", participationRoutes)

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// Start server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})



