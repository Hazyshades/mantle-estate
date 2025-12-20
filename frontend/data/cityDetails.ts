export interface CityDetails {
  city: string;
  population: number;
  elevation: string; // e.g., "597 ft"
  area: string; // e.g., "234 mi²"
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  trendSummary: string;
}

export const cityDetailsData: Record<string, CityDetails> = {
  "Chicago, IL": {
    city: "Chicago, IL",
    population: 2746388,
    elevation: "597 ft",
    area: "234 mi²",
    coordinates: { lat: 41.8781, lng: -87.6298 },
    description: "Chicago is the most populous city in the U.S. state of Illinois and in the Midwestern United States. With a population of 2,746,388, as of the 2020 census, it is the third-most populous city in the United States after New York City and Los Angeles.",
    trendSummary: "Home prices rose moderately by 2-7% early in the year but cooled slightly towards year-end, with average values up 2.2% overall."
  },
  "New York, NY": {
    city: "New York, NY",
    population: 8336817,
    elevation: "33 ft",
    area: "302.6 mi²",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    description: "New York City is the most populous city in the United States. Located at the southern tip of New York State, the city is the center of the New York metropolitan area, the largest metropolitan area in the world by urban landmass.",
    trendSummary: "Prices increased by about 3%, driven by revitalization in key areas like Manhattan, where medians hit post-pandemic highs."
  },
  "Miami, FL": {
    city: "Miami, FL",
    population: 442241,
    elevation: "6 ft",
    area: "55.27 mi²",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    description: "Miami is a coastal metropolis and the seat of Miami-Dade County in South Florida. With a population of 442,241 as of 2020, it is the second-most populous city in Florida after Jacksonville.",
    trendSummary: "Market cooled with prices down 3-6% year-over-year, amid higher inventory and moderating demand."
  },
  "Los Angeles, CA": {
    city: "Los Angeles, CA",
    population: 3898747,
    elevation: "305 ft",
    area: "502.7 mi²",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    description: "Los Angeles is the most populous city in California and the second-most populous city in the United States. It is known for its Mediterranean climate, ethnic diversity, and the entertainment industry.",
    trendSummary: "Prices fluctuated modestly, ending with 2-3% growth despite early dips, supported by steady demand."
  },
  "Dallas, TX": {
    city: "Dallas, TX",
    population: 1304379,
    elevation: "430 ft",
    area: "385.8 mi²",
    coordinates: { lat: 32.7767, lng: -96.7970 },
    description: "Dallas is a city in Texas and the most populous city in the Dallas–Fort Worth metroplex, the fourth-largest metropolitan area in the United States at 7.5 million people.",
    trendSummary: "Prices moderated with declines of 4-7% in some counties, though medians rose 12% in core areas due to inventory shifts."
  },
  "Houston, TX": {
    city: "Houston, TX",
    population: 2304580,
    elevation: "80 ft",
    area: "669.8 mi²",
    coordinates: { lat: 29.7604, lng: -95.3698 },
    description: "Houston is the most populous city in Texas and the fourth-most populous city in the United States. It is the largest city in the Southern United States and the largest city in the U.S. state of Texas.",
    trendSummary: "Modest growth of 3-4% prevailed, with median prices up amid resilient sales and population inflows."
  },
  "Washington, DC": {
    city: "Washington, DC",
    population: 689545,
    elevation: "409 ft",
    area: "68.34 mi²",
    coordinates: { lat: 38.9072, lng: -77.0369 },
    description: "Washington, D.C., formally the District of Columbia, is the capital city and federal district of the United States. It is located on the east bank of the Potomac River.",
    trendSummary: "Prices declined by 3-11% year-to-date, cooling due to policy changes and increased supply."
  },
  "Philadelphia, PA": {
    city: "Philadelphia, PA",
    population: 1584064,
    elevation: "39 ft",
    area: "142.6 mi²",
    coordinates: { lat: 39.9526, lng: -75.1652 },
    description: "Philadelphia, colloquially referred to as Philly, is the most populous city in Pennsylvania and the sixth-most populous city in the United States.",
    trendSummary: "Competitive market drove 3-6% price increases, with low inventory and strong buyer interest."
  }
};

export function getCityDetails(cityName: string): CityDetails | null {
  // Try exact match first
  if (cityDetailsData[cityName]) {
    return cityDetailsData[cityName];
  }
  
  // Try matching by city name only (before comma)
  const cityOnly = cityName.split(",")[0].trim();
  for (const [key, value] of Object.entries(cityDetailsData)) {
    if (key.startsWith(cityOnly)) {
      return value;
    }
  }
  
  return null;
}

// Function to get map image URL with city marker
export function getCityMapUrl(cityName: string, coordinates?: { lat: number; lng: number }): string {
  const cityDetails = getCityDetails(cityName);
  const coords = coordinates || cityDetails?.coordinates;
  
  if (!coords) {
    return "";
  }
  
  // Use alternative static map service - using a tile-based approach
  // For USA overview, we'll use a service that works better
  // Using OpenStreetMap tile service with custom rendering
  // Alternative: Use a simple tile-based static map
  
  // Try using a different static map service format
  // Using staticmap.openstreetmap.de with corrected parameters
  const centerLat = 39.8283;
  const centerLng = -98.5795;
  const zoom = 4;
  
  // Try multiple formats to ensure compatibility
  // Format 1: Standard OpenStreetMap static map
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=800x400&markers=${coords.lat},${coords.lng},red`;
}

// Alternative: Get iframe URL for interactive map showing USA with city marker
export function getCityMapIframeUrl(cityName: string, coordinates?: { lat: number; lng: number }): string {
  const cityDetails = getCityDetails(cityName);
  const coords = coordinates || cityDetails?.coordinates;
  
  if (!coords) {
    return "";
  }
  
  // Use OpenStreetMap with embed showing USA overview
  // Calculate bounding box to show entire USA
  // USA approximate bounds: west: -125, east: -66, north: 50, south: 24
  const bbox = "-125,24,-66,50"; // west, south, east, north
  
  // Use OpenStreetMap embed with marker
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
}

