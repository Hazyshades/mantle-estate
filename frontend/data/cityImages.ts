export interface CityImageCategory {
  sights: string[];
  outdoors: string[];
}

export const cityImageMap: Record<string, CityImageCategory> = {
  "new york": {
    sights: [
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "miami": {
    sights: [
      "https://www.miamiandbeaches.com/getmedia/9d5a6543-44ad-4279-84bb-cfd10059e57e/Skywheel_Miami_1440x900.jpg",
      "https://images.unsplash.com/photo-1514214246283-42759d8fa111?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1514214246283-42759d8fa111?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "los angeles": {
    sights: [
      "https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "chicago": {
    sights: [
      "https://images.unsplash.com/photo-1494522358652-f30e61a60313?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "philadelphia": {
    sights: [
      "https://images.unsplash.com/photo-1508770218424-753a10cd8117?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "dallas": {
    sights: [
      "https://images.unsplash.com/photo-1653862496605-e994e87392ec?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "houston": {
    sights: [
      "https://images.unsplash.com/photo-1629924887151-3a7494ff0334?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "washington": {
    sights: [
      "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "london": {
    sights: [
      "https://offloadmedia.feverup.com/secretldn.com/wp-content/uploads/2022/06/25124714/shutterstock_2079973213-1-1024x657.jpg"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "paris": {
    sights: [
      "https://meet-thelocals.com/wp-content/uploads/2019/10/Eiffel-Tower-view-Paris-1024x683.jpg"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "tokyo": {
    sights: [
      "https://images.unsplash.com/photo-1557409518-1b1ad1ac120d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "singapore": {
    sights: [
      "https://www.traveltalktours.com/wp-content/smush-webp/2023/12/guo-xin-goh-8juRlGCr5c-unsplash-1-scaled.jpg.webp"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "berlin": {
    sights: [
      "https://images.squarespace-cdn.com/content/v1/6885522713c6cd559686b2fd/48e0b35f-4b5f-4252-b45b-547eabfbc3b4/berlin-skyline-sunset-berliner-dom.jpg"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  },
  "dubai": {
    sights: [
      "https://images.locationscout.net/2021/05/the-best-view-of-dubai-united-arab-emirates.webp?h=1400&q=80"
    ],
    outdoors: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
    ]
  }
};

export function getCityImage(cityName: string): string | null {
  // Extract city name without state/country and convert to lowercase
  const cityOnly = cityName.split(",")[0].trim().toLowerCase();
  
  if (cityImageMap[cityOnly]) {
    const sights = cityImageMap[cityOnly].sights;
    return Array.isArray(sights) ? sights[0] : sights; // Return first sight for backward compatibility
  }
  
  return null;
}

export function getCityImages(cityName: string): CityImageCategory | null {
  // Extract city name without state/country and convert to lowercase
  const cityOnly = cityName.split(",")[0].trim().toLowerCase();
  
  if (cityImageMap[cityOnly]) {
    return cityImageMap[cityOnly];
  }
  
  return null;
}

