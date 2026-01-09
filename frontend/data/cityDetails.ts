export interface CityDetails {
  city: string;
  population: number;
  elevation: string; // e.g., "597 ft"
  area: string; // e.g., "234 mi²"
  costOfLivingIndex: number; // Index of Cost of Living
  unemploymentRate: number; // Unemployment Rate
  violentCrimesPer100k: number; // Violent Crimes per 100k
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
    costOfLivingIndex: 118,
    unemploymentRate: 4.8,
    violentCrimesPer100k: 850,
    coordinates: { lat: 41.8781, lng: -87.6298 },
    description: "Chicago is the most populous city in the U.S. state of Illinois and in the Midwestern United States. With a population of 2,746,388, as of the 2020 census, it is the third-most populous city in the United States after New York City and Los Angeles.",
    trendSummary: "Home prices rose moderately by 2-7% early in the year but cooled slightly towards year-end, with average values up 2.2% overall."
  },
  "New York, NY": {
    city: "New York, NY",
    population: 8336817,
    elevation: "33 ft",
    area: "302.6 mi²",
    costOfLivingIndex: 161,
    unemploymentRate: 4.75, // average between 4.5 and 5
    violentCrimesPer100k: 450,
    coordinates: { lat: 40.7128, lng: -74.0060 },
    description: "New York City is the most populous city in the United States. Located at the southern tip of New York State, the city is the center of the New York metropolitan area, the largest metropolitan area in the world by urban landmass.",
    trendSummary: "Prices increased by about 3%, driven by revitalization in key areas like Manhattan, where medians hit post-pandemic highs."
  },
  "Miami, FL": {
    city: "Miami, FL",
    population: 442241,
    elevation: "6 ft",
    area: "55.27 mi²",
    costOfLivingIndex: 125,
    unemploymentRate: 4.5,
    violentCrimesPer100k: 550,
    coordinates: { lat: 25.7617, lng: -80.1918 },
    description: "Miami is a coastal metropolis and the seat of Miami-Dade County in South Florida. With a population of 442,241 as of 2020, it is the second-most populous city in Florida after Jacksonville.",
    trendSummary: "Market cooled with prices down 3-6% year-over-year, amid higher inventory and moderating demand."
  },
  "Los Angeles, CA": {
    city: "Los Angeles, CA",
    population: 3898747,
    elevation: "305 ft",
    area: "502.7 mi²",
    costOfLivingIndex: 135,
    unemploymentRate: 5.3,
    violentCrimesPer100k: 550,
    coordinates: { lat: 34.0522, lng: -118.2437 },
    description: "Los Angeles is the most populous city in California and the second-most populous city in the United States. It is known for its Mediterranean climate, ethnic diversity, and the entertainment industry.",
    trendSummary: "Prices fluctuated modestly, ending with 2-3% growth despite early dips, supported by steady demand."
  },
  "Dallas, TX": {
    city: "Dallas, TX",
    population: 1304379,
    elevation: "430 ft",
    area: "385.8 mi²",
    costOfLivingIndex: 102,
    unemploymentRate: 4.2,
    violentCrimesPer100k: 450,
    coordinates: { lat: 32.7767, lng: -96.7970 },
    description: "Dallas is a city in Texas and the most populous city in the Dallas–Fort Worth metroplex, the fourth-largest metropolitan area in the United States at 7.5 million people.",
    trendSummary: "Prices moderated with declines of 4-7% in some counties, though medians rose 12% in core areas due to inventory shifts."
  },
  "Houston, TX": {
    city: "Houston, TX",
    population: 2304580,
    elevation: "80 ft",
    area: "669.8 mi²",
    costOfLivingIndex: 97,
    unemploymentRate: 4.5,
    violentCrimesPer100k: 850,
    coordinates: { lat: 29.7604, lng: -95.3698 },
    description: "Houston is the most populous city in Texas and the fourth-most populous city in the United States. It is the largest city in the Southern United States and the largest city in the U.S. state of Texas.",
    trendSummary: "Modest growth of 3-4% prevailed, with median prices up amid resilient sales and population inflows."
  },
  "Washington, DC": {
    city: "Washington, DC",
    population: 689545,
    elevation: "409 ft",
    area: "68.34 mi²",
    costOfLivingIndex: 145,
    unemploymentRate: 5.5,
    violentCrimesPer100k: 900,
    coordinates: { lat: 38.9072, lng: -77.0369 },
    description: "Washington, D.C., formally the District of Columbia, is the capital city and federal district of the United States. It is located on the east bank of the Potomac River.",
    trendSummary: "Prices declined by 3-11% year-to-date, cooling due to policy changes and increased supply."
  },
  "Philadelphia, PA": {
    city: "Philadelphia, PA",
    population: 1584064,
    elevation: "39 ft",
    area: "142.6 mi²",
    costOfLivingIndex: 112,
    unemploymentRate: 5.0,
    violentCrimesPer100k: 750,
    coordinates: { lat: 39.9526, lng: -75.1652 },
    description: "Philadelphia, colloquially referred to as Philly, is the most populous city in Pennsylvania and the sixth-most populous city in the United States.",
    trendSummary: "Competitive market drove 3-6% price increases, with low inventory and strong buyer interest."
  },
  // Europe
  "London, UK": {
    city: "London, UK",
    population: 8982000,
    elevation: "36 ft",
    area: "607 mi²",
    costOfLivingIndex: 161,
    unemploymentRate: 5.0,
    violentCrimesPer100k: 450,
    coordinates: { lat: 51.5074, lng: -0.1278 },
    description: "London is the capital and largest city of England and the United Kingdom. It is one of the world's major global cities, with strengths in the arts, commerce, education, entertainment, fashion, finance, healthcare, media, professional services, research and development, tourism, and transport.",
    trendSummary: "Prices were mixed but overall flat to down slightly (0% to -2.4% y-o-y), with some boroughs rising modestly while inner areas declined amid affordability challenges and policy impacts."
  },
  "Paris, France": {
    city: "Paris, France",
    population: 2161000,
    elevation: "115 ft",
    area: "40.7 mi²",
    costOfLivingIndex: 125,
    unemploymentRate: 7.7,
    violentCrimesPer100k: 450,
    coordinates: { lat: 48.8566, lng: 2.3522 },
    description: "Paris is the capital and most populous city of France. Known for its iconic landmarks such as the Eiffel Tower and Notre-Dame Cathedral, Paris is a major European city and a global center for art, fashion, gastronomy, and culture.",
    trendSummary: "Prices stabilized with modest growth (+0.4% to +1.9% y-o-y nationally), showing early recovery in core areas but declines in some cities; luxury segment rebounded strongly."
  },
  "Berlin, Germany": {
    city: "Berlin, Germany",
    population: 3677000,
    elevation: "112 ft",
    area: "344.3 mi²",
    costOfLivingIndex: 105,
    unemploymentRate: 9.5,
    violentCrimesPer100k: 550,
    coordinates: { lat: 52.5200, lng: 13.4050 },
    description: "Berlin is the capital and largest city of Germany. It is a major center for politics, culture, media, and science. Berlin's economy is based on high-tech firms and the service sector, encompassing a diverse range of creative industries, research facilities, media corporations, and convention venues.",
    trendSummary: "Prices stabilized or rose modestly (+1-3% in major cities), with recovery in demand but segmented performance; new builds dipped slightly."
  },
  // APAC
  "Tokyo, Japan": {
    city: "Tokyo, Japan",
    population: 13960000,
    elevation: "131 ft",
    area: "845.7 mi²",
    costOfLivingIndex: 85,
    unemploymentRate: 2.6,
    violentCrimesPer100k: 35,
    coordinates: { lat: 35.6762, lng: 139.6503 },
    description: "Tokyo is the capital and largest city of Japan. It is one of the most populous metropolitan areas in the world and serves as Japan's economic, cultural, and political center. Tokyo is known for its modern architecture, shopping, pop culture, and dining.",
    trendSummary: "Strong growth with prices up 5-12% y-o-y, driven by foreign investment, weak yen, and urban demand; existing condos surged significantly."
  },
  "Singapore, Singapore": {
    city: "Singapore, Singapore",
    population: 5454000,
    elevation: "52 ft",
    area: "277.6 mi²",
    costOfLivingIndex: 127.5,
    unemploymentRate: 2.0,
    violentCrimesPer100k: 75,
    coordinates: { lat: 1.3521, lng: 103.8198 },
    description: "Singapore is a sovereign island city-state in maritime Southeast Asia. It is a global financial center and one of the world's most expensive cities. Singapore is known for its multiculturalism, clean environment, and strong economy.",
    trendSummary: "Prices rose moderately (+3.4% to +5% y-o-y), led by landed properties; growth slowed from prior years amid cooling measures."
  },
  "Dubai, UAE": {
    city: "Dubai, UAE",
    population: 3408000,
    elevation: "33 ft",
    area: "1584.4 mi²",
    costOfLivingIndex: 105,
    unemploymentRate: 2.5,
    violentCrimesPer100k: 150,
    coordinates: { lat: 25.2048, lng: 55.2708 },
    description: "Dubai is the most populous city in the United Arab Emirates and the capital of the Emirate of Dubai. It is a global city and business hub of the Middle East. Dubai is known for its luxury shopping, ultramodern architecture, and lively nightlife scene.",
    trendSummary: "Robust growth (+10-20% y-o-y in sales prices), fueled by population inflows and luxury demand; villas outperformed."
  },
  "Hong Kong, Hong Kong": {
    city: "Hong Kong, Hong Kong",
    population: 7507000,
    elevation: "1640 ft",
    area: "426.3 mi²",
    costOfLivingIndex: 130,
    unemploymentRate: 3.85,
    violentCrimesPer100k: 75,
    coordinates: { lat: 22.3193, lng: 114.1694 },
    description: "Hong Kong is a special administrative region of China. It is a global financial center and one of the world's most densely populated cities. Hong Kong is known for its deep natural harbor, skyline, and free-market economy.",
    trendSummary: "Prices stabilized with slight gains (+1-2% y-o-y after prior declines), supported by rate cuts; market activity improved."
  },
  "Shanghai, China": {
    city: "Shanghai, China",
    population: 24870000,
    elevation: "13 ft",
    area: "2486.3 mi²",
    costOfLivingIndex: 75,
    unemploymentRate: 5.0,
    violentCrimesPer100k: 75,
    coordinates: { lat: 31.2304, lng: 121.4737 },
    description: "Shanghai is one of the four direct-administered municipalities of China and the most populous city in the world. It is a global financial center and transport hub, with the world's busiest container port. Shanghai is known for its modern skyline, historical landmarks, and vibrant culture.",
    trendSummary: "Mixed: overall declines moderated, but luxury/core areas up strongly (some +30%); suburban prices down amid national slowdown."
  },
  "Sydney, Australia": {
    city: "Sydney, Australia",
    population: 5312000,
    elevation: "148 ft",
    area: "4776.2 mi²",
    costOfLivingIndex: 125,
    unemploymentRate: 4.3,
    violentCrimesPer100k: 450,
    coordinates: { lat: -33.8688, lng: 151.2093 },
    description: "Sydney is the capital city of the state of New South Wales and the most populous city in Australia. It is known for its harbor front Sydney Opera House, the iconic Sydney Harbour Bridge, and beautiful beaches. Sydney is Australia's economic and cultural center.",
    trendSummary: "Solid growth (+4-8.6% nationally, Sydney ~+5-6%), reaching record highs; driven by supply shortages and demand."
  },
  "Seoul, South Korea": {
    city: "Seoul, South Korea",
    population: 9720000,
    elevation: "126 ft",
    area: "233.7 mi²",
    costOfLivingIndex: 95,
    unemploymentRate: 2.7,
    violentCrimesPer100k: 75,
    coordinates: { lat: 37.5665, lng: 126.9780 },
    description: "Seoul is the capital and largest metropolis of South Korea. It is a major global city with a population exceeding 9.7 million people. Seoul is the center of politics, economy, culture, and transportation in South Korea, known for its rapid modernization and traditional heritage.",
    trendSummary: "Sharp rise (+8.71% y-o-y in apartments), fastest in 19 years despite measures; concentrated in prime areas."
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

// Alternative: Get iframe URL for interactive map focused on the city
export function getCityMapIframeUrl(cityName: string, coordinates?: { lat: number; lng: number }): string {
  const cityDetails = getCityDetails(cityName);
  const coords = coordinates || cityDetails?.coordinates;
  
  if (!coords) {
    return "";
  }
  
  // Calculate bounding box around the city (approximately 5 degrees in each direction)
  // This ensures the city is centered and visible with some context
  const latOffset = 5; // degrees
  const lngOffset = 5; // degrees
  
  const west = coords.lng - lngOffset;
  const south = coords.lat - latOffset;
  const east = coords.lng + lngOffset;
  const north = coords.lat + latOffset;
  
  const bbox = `${west},${south},${east},${north}`; // west, south, east, north
  
  // Use OpenStreetMap embed with marker centered on the city
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
}



