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
  },
  // Europe
  "London, UK": {
    city: "London, UK",
    trendSummary: "Prices were mixed but overall flat to down slightly (0% to -2.4% y-o-y), with some boroughs rising modestly while inner areas declined amid affordability challenges and policy impacts."
  },
  "Paris, France": {
    city: "Paris, France",
    trendSummary: "Prices stabilized with modest growth (+0.4% to +1.9% y-o-y nationally), showing early recovery in core areas but declines in some cities; luxury segment rebounded strongly."
  },
  "Berlin, Germany": {
    city: "Berlin, Germany",
    trendSummary: "Prices stabilized or rose modestly (+1-3% in major cities), with recovery in demand but segmented performance; new builds dipped slightly."
  },
  // APAC
  "Tokyo, Japan": {
    city: "Tokyo, Japan",
    trendSummary: "Strong growth with prices up 5-12% y-o-y, driven by foreign investment, weak yen, and urban demand; existing condos surged significantly."
  },
  "Singapore, Singapore": {
    city: "Singapore, Singapore",
    trendSummary: "Prices rose moderately (+3.4% to +5% y-o-y), led by landed properties; growth slowed from prior years amid cooling measures."
  },
  "Dubai, UAE": {
    city: "Dubai, UAE",
    trendSummary: "Robust growth (+10-20% y-o-y in sales prices), fueled by population inflows and luxury demand; villas outperformed."
  },
  "Hong Kong, Hong Kong": {
    city: "Hong Kong, Hong Kong",
    trendSummary: "Prices stabilized with slight gains (+1-2% y-o-y after prior declines), supported by rate cuts; market activity improved."
  },
  "Shanghai, China": {
    city: "Shanghai, China",
    trendSummary: "Mixed: overall declines moderated, but luxury/core areas up strongly (some +30%); suburban prices down amid national slowdown."
  },
  "Sydney, Australia": {
    city: "Sydney, Australia",
    trendSummary: "Solid growth (+4-8.6% nationally, Sydney ~+5-6%), reaching record highs; driven by supply shortages and demand."
  },
  "Seoul, South Korea": {
    city: "Seoul, South Korea",
    trendSummary: "Sharp rise (+8.71% y-o-y in apartments), fastest in 19 years despite measures; concentrated in prime areas."
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







