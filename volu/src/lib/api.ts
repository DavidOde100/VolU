// src/lib/api.ts
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const getNotifications = async () => {
  const response = await axios.get(`${API_URL}/notifications`)
  return response.data
}
