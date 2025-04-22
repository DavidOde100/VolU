/**
 * Calculate the distance between two addresses
 * In a real implementation, this would use a geocoding service like Google Maps
 * For this example, we'll return a random distance between 1 and 50 miles
 */
export async function calculateDistance(address1: string, address2: string): Promise<number> {
    // In a real implementation, you would:
    // 1. Geocode both addresses to get lat/long coordinates
    // 2. Calculate the distance using the Haversine formula
  
    // For this example, we'll simulate a distance calculation
    // If the addresses have the same zip code, return a small distance
    const zip1 = address1.split(" ").pop()?.substring(0, 5)
    const zip2 = address2.split(" ").pop()?.substring(0, 5)
  
    if (zip1 === zip2) {
      // Same zip code, return a small distance (1-5 miles)
      return Math.floor(Math.random() * 5) + 1
    }
  
    // Different zip codes, return a larger distance (5-50 miles)
    return Math.floor(Math.random() * 45) + 5
  }
  
  