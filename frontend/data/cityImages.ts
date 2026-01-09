export interface CityImageCategory {
  sights: string[];
  outdoors: string[];
  cardImage?: string; // Image for the card on the main page
}

// Images for the card on the main page
export const cityCardImageMap: Record<string, string> = {
  "new york": "/images/new-york-card.jpg",
  "miami": "/images/miami-card.jpg",
  "los angeles": "/images/los-angeles-card.jpg",
  "chicago": "/images/chicago-card.jpg",
  "philadelphia": "/images/philadelphia-card.jpg",
  "dallas": "/images/dallas-card.jpg",
  "houston": "/images/houston-card.jpg",
  "washington": "/images/washington-card.jpg",
  "london": "/images/london-card.jpg",
  "paris": "/images/paris-card.jpg",
  "tokyo": "/images/tokyo-card.jpg",
  "singapore": "/images/singapore-card.webp",
  "berlin": "/images/berlin-card.jpg",
  "dubai": "/images/dubai-card.webp",
  "hong kong": "/images/hong-kong-card.jpg",
  "shanghai": "/images/shanghai-card.jpg",
  "sydney": "/images/sydney-card.jpg",
  "seoul": "/images/seoul-card.jpg"
};

export interface CityImageCategory {
  sights: string[];
  outdoors: string[];
  cardImage?: string; // Image for the card on the main page
}

export const cityImageMap: Record<string, CityImageCategory> = {
  "new york": {
    sights: ["/images/new-york-card.jpg"], // NYC skyline - use card image
    outdoors: ["/images/new-york-outdoors.jpg"] // Central Park autumn
  },
  "miami": {
    sights: ["/images/miami-sights.jpg"], // Miami skyline sunset over bay
    outdoors: ["/images/miami-outdoors.jpg"] // South Beach with ocean and palms
  },
  "los angeles": {
    sights: ["/images/los-angeles-sights.jpg"], // Hollywood sign with skyline
    outdoors: ["/images/los-angeles-outdoors.jpg"] // Griffith Observatory view
  },
  "chicago": {
    sights: ["/images/chicago-sights.jpg"], // Chicago skyline with Willis Tower
    outdoors: ["/images/chicago-outdoors.jpg"] // Cloud Gate (Bean) in Millennium Park
  },
  "philadelphia": {
    sights: ["/images/philadelphia-sights.jpg"], // Philly skyline at twilight
    outdoors: ["/images/philadelphia-outdoors.jpeg"] // Fairmount Park
  },
  "dallas": {
    sights: ["/images/dallas-sights.jpg"], // Dallas skyline with Reunion Tower
    outdoors: ["/images/dallas-outdoors.jpg"] // White Rock Lake aerial
  },
  "houston": {
    sights: ["/images/houston-sights.jpg"], // Houston skyline
    outdoors: ["/images/houston-outdoors.jpg"] // Buffalo Bayou Park
  },
  "washington": {
    sights: ["/images/washington-sights.jpg"],
    outdoors: ["/images/washington-outdoors.jpg"] // National Mall reflecting pool
  },
  "london": {
    sights: ["/images/london-sights.jpeg"], // Big Ben & Thames
    outdoors: ["/images/london-outdoors.jpg"] // Hyde Park
  },
  "paris": {
    sights: ["/images/paris-sights.jpg"], // Eiffel Tower sunset
    outdoors: ["/images/paris-outdoors.jpg"] // Seine River bridges
  },
  "tokyo": {
    sights: ["/images/tokyo-sights.jpg"], // Tokyo skyline with towers
    outdoors: ["/images/tokyo-outdoors.jpg"] // Shinjuku Gyoen garden
  },
  "singapore": {
    sights: ["/images/singapore-sights.jpg"], // Marina Bay Sands skyline
    outdoors: ["/images/singapore-outdoors.jpg"] // Supertrees at Gardens by the Bay
  },
  "berlin": {
    sights: ["/images/berlin-sights.jpg"], // Brandenburg Gate & TV Tower
    outdoors: ["/images/berlin-outdoors.jpg"] // Tiergarten park
  },
  "dubai": {
    sights: ["/images/dubai-sights.jpg"], // Burj Khalifa at night
    outdoors: ["/images/dubai-outdoors.jpg"] // Desert safari scene
  },
  "hong kong": {
    sights: ["/images/hong-kong-sights.jpg"], // Hong Kong skyline
    outdoors: ["/images/hong-kong-outdoors.jpg"] // Victoria Harbour
  },
  "shanghai": {
    sights: ["/images/shanghai-sights.jpg"], // Shanghai skyline with Oriental Pearl Tower
    outdoors: ["/images/shanghai-outdoors.jpg"] // The Bund
  },
  "sydney": {
    sights: ["/images/sydney-sights.jpg"], // Sydney Opera House and Harbour Bridge
    outdoors: ["/images/sydney-outdoors.jpg"] // Bondi Beach
  },
  "seoul": {
    sights: ["/images/seoul-sights.jpg"], // Seoul skyline with N Seoul Tower
    outdoors: ["/images/seoul-outdoors.jpg"] // Bukhansan National Park
  }
};

/**
 * Get image for the card on the main page
 */
export function getCityCardImage(cityName: string): string | null {
  // Extract city name without state/country and convert to lowercase
  const cityOnly = cityName.split(",")[0].trim().toLowerCase();
  
  if (cityCardImageMap[cityOnly]) {
    return cityCardImageMap[cityOnly];
  }
  
  return null;
}

/**
 * Get image for the city (for backward compatibility, uses sights)
 * @deprecated Use getCityCardImage for the card on the main page
 */
export function getCityImage(cityName: string): string | null {
  // Extract city name without state/country and convert to lowercase
  const cityOnly = cityName.split(",")[0].trim().toLowerCase();
  
  // Try to get cardImage
  if (cityCardImageMap[cityOnly]) {
    return cityCardImageMap[cityOnly];
  }
  
  // Fallback to sights for backward compatibility
  if (cityImageMap[cityOnly]) {
    const sights = cityImageMap[cityOnly].sights;
    return Array.isArray(sights) ? sights[0] : sights;
  }
  
  return null;
}

export function getCityImages(cityName: string): CityImageCategory | null {
  // Extract city name without state/country and convert to lowercase
  const cityOnly = cityName.split(",")[0].trim().toLowerCase();
  
  if (cityImageMap[cityOnly]) {
    const cityData = cityImageMap[cityOnly];
    // Normalize to arrays - handle both string and array formats
    return {
      sights: Array.isArray(cityData.sights) ? cityData.sights : [cityData.sights],
      outdoors: Array.isArray(cityData.outdoors) ? cityData.outdoors : [cityData.outdoors],
    };
  }
  
  return null;
}


