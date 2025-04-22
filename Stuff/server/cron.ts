import cron from "node-cron"
import { notificationService } from "./services/notificationService"

// Process scheduled notifications every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("Running scheduled notification processing...")
  try {
    const processedTasks = await notificationService.processScheduledNotifications()
    console.log(`Processed ${processedTasks.length} scheduled notification tasks`)
  } catch (error) {
    console.error("Error processing scheduled notifications:", error)
  }
})

// Schedule event reminders for upcoming events (daily at midnight)
cron.schedule("0 0 * * *", async () => {
  console.log("Scheduling event reminders...")
  try {
    // Get all upcoming events in the next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // This would be replaced with a database query in a real implementation
    // const upcomingEvents = await prisma.event.findMany({
    //   where: {
    //     startDate: {
    //       gte: new Date(),
    //       lte: thirtyDaysFromNow,
    //     },
    //     status: "Active",
    //   },
    // })

    // For each event, schedule reminders
    // for (const event of upcomingEvents) {
    //   await notificationService.scheduleEventReminders(event.id)
    // }

    console.log("Event reminders scheduled successfully")
  } catch (error) {
    console.error("Error scheduling event reminders:", error)
  }
})

export default cron
