export interface CityInfo {
  city: string;
  trendSummary: string;
}

export const cityInfoData: Record<string, CityInfo> = {
  "Chicago, IL": {
    city: "Chicago, IL",
    trendSummary: "Home prices rose moderately by 2-7% early in the year but cooled slightly towards year-end, with average values up 2.2% overall."
  },
  "New York, NY": {
    city: "New York, NY",
    trendSummary: "Prices increased by about 3%, driven by revitalization in key areas like Manhattan, where medians hit post-pandemic highs."
  },
  "Miami, FL": {
    city: "Miami, FL",
    trendSummary: "Market cooled with prices down 3-6% year-over-year, amid higher inventory and moderating demand."
  },
  "Los Angeles, CA": {
    city: "Los Angeles, CA",
    trendSummary: "Prices fluctuated modestly, ending with 2-3% growth despite early dips, supported by steady demand."
  },
  "Dallas, TX": {
    city: "Dallas, TX",
    trendSummary: "Prices moderated with declines of 4-7% in some counties, though medians rose 12% in core areas due to inventory shifts."
  },
  "Houston, TX": {
    city: "Houston, TX",
    trendSummary: "Modest growth of 3-4% prevailed, with median prices up amid resilient sales and population inflows."
  },
  "Washington, DC": {
    city: "Washington, DC",
    trendSummary: "Prices declined by 3-11% year-to-date, cooling due to policy changes and increased supply."
  },
  "Philadelphia, PA": {
    city: "Philadelphia, PA",
    trendSummary: "Competitive market drove 3-6% price increases, with low inventory and strong buyer interest."
  }
};

export function getCityInfo(cityName: string): CityInfo | null {
  // Try exact match first
  if (cityInfoData[cityName]) {
    return cityInfoData[cityName];
  }
  
  // Try matching by city name only (before comma)
  const cityOnly = cityName.split(",")[0].trim();
  for (const [key, value] of Object.entries(cityInfoData)) {
    if (key.startsWith(cityOnly)) {
      return value;
    }
  }
  
  return null;
}
