const run = async () => {
    // First, load the cron scheduler
    await import("./cron")
  
    // Then load the express app
    const appModule = await import("./index")
    const app = appModule.default // ⬅️ This is safe if `index.ts` uses export default
  
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  }
  
  run()
  
  