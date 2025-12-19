export interface CityImageCategory {
  sights: string[];
  outdoors: string[];
  cardImage?: string; // Image for the card on the main page
}

// Images for the card on the main page
export const cityCardImageMap: Record<string, string> = {
  "new york": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "miami": "https://www.miamiandbeaches.com/getmedia/9d5a6543-44ad-4279-84bb-cfd10059e57e/Skywheel_Miami_1440x900.jpg",
  "los angeles": "https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "chicago": "https://images.unsplash.com/photo-1494522358652-f30e61a60313?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "philadelphia": "https://images.unsplash.com/photo-1508770218424-753a10cd8117?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "dallas": "https://images.unsplash.com/photo-1653862496605-e994e87392ec?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "houston": "https://images.unsplash.com/photo-1629924887151-3a7494ff0334?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "washington": "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "london": "https://offloadmedia.feverup.com/secretldn.com/wp-content/uploads/2022/06/25124714/shutterstock_2079973213-1-1024x657.jpg",
  "paris": "https://meet-thelocals.com/wp-content/uploads/2019/10/Eiffel-Tower-view-Paris-1024x683.jpg",
  "tokyo": "https://images.unsplash.com/photo-1557409518-1b1ad1ac120d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "singapore": "https://www.traveltalktours.com/wp-content/smush-webp/2023/12/guo-xin-goh-8juRlGCr5c-unsplash-1-scaled.jpg.webp",
  "berlin": "https://images.squarespace-cdn.com/content/v1/6885522713c6cd559686b2fd/48e0b35f-4b5f-4252-b45b-547eabfbc3b4/berlin-skyline-sunset-berliner-dom.jpg",
  "dubai": "https://images.locationscout.net/2021/05/the-best-view-of-dubai-united-arab-emirates.webp?h=1400&q=80"
};

export interface CityImageCategory {
  sights: string[];
  outdoors: string[];
  cardImage?: string; // Image for the card on the main page
}

export const cityImageMap: Record<string, CityImageCategory> = {
  "new york": {
    sights: ["https://scontent-lga3-2.xx.fbcdn.net/v/t39.30808-6/494721079_1453556805907483_7715653555555023016_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=KlK9ru8jMKAQ7kNvwHxwv0X&_nc_oc=AdklWoi4aZDkzFyWl4PvoKgaqreq6Jh-GzOmq6T9M4FtKOW1XeppTUAMxjfkFuI71Pc&_nc_zt=23&_nc_ht=scontent-lga3-2.xx&_nc_gid=0qhbuV1EjNPgJGaLMpKN8A&oh=00_AfkY4Kt4-UYgUIyC6mqFboeCP6FY4BvKCjKkPpXOdApHAA&oe=694B8FC1"], // NYC skyline at blue hour with Empire State
    outdoors: "https://theinsatiabletraveler.com/wp-content/uploads/2015/11/Best-Places-to-see-Fall-Colors-in-Central-Park-4761.jpg" // Central Park autumn
  },
  "miami": {
    sights: "https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/sunset-above-downtown-miami-skyline-and-biscayne-bay-miroslav-liska.jpg", // Miami skyline sunset over bay
    outdoors: "https://citytravelcompanion.com/wp-content/uploads/2024/06/vibrant_miami_beach_scene.jpg" // South Beach with ocean and palms
  },
  "los angeles": {
    sights: "https://www.exp1.com/blog/wp-content/uploads/sites/7/2018/03/Hollywood-Sign-in-LA-with-pink-sky.jpg", // Hollywood sign with skyline
    outdoors: "https://www.travelcaffeine.com/wp-content/uploads/2016/11/griffith-observatory-los-angeles-skyline-low-dawn-blue-bricker.jpg" // Griffith Observatory view
  },
  "chicago": {
    sights: "https://imgc.allpostersimages.com/img/posters/amanda-hall-chicago-skyline-and-lake-michigan-at-dusk-with-the-willis-tower-on-the-left-chicago-illinois-usa_u-l-pib29h0.jpg?artHeight=550&artPerspective=n&artWidth=550&background=ffffff", // Chicago skyline with Willis Tower
    outdoors: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/8b/29/1e/one-of-our-favourite.jpg?w=900&h=-1&s=1" // Cloud Gate (Bean) in Millennium Park
  },
  "philadelphia": {
    sights: "https://thumbs.dreamstime.com/b/vibrant-cityscape-philadelphia-twilight-iconic-skyline-features-modern-skyscrapers-historic-architecture-413558443.jpg", // Philly skyline at twilight
    outdoors: "https://accessglobal.media.clients.ellingtoncms.com/uploads/froala_editor/images/Fairmount%20Park%201.jpeg" // Fairmount Park
  },
  "dallas": {
    sights: "https://reuniontower.com/wp-content/uploads/2023/03/hero-1.jpg", // Dallas skyline with Reunion Tower
    outdoors: "https://lakehighlands.advocatemag.com/wp-content/uploads/2018/09/1504290007_DannyFulgencio_AerialWhiteRockLake_ED_63.jpg" // White Rock Lake aerial
  },
  "houston": {
    sights: "https://res.cloudinary.com/sagacity/image/upload/c_crop,h_1200,w_1800,x_0,y_0/c_limit,dpr_auto,f_auto,fl_lossy,q_80,w_1200/sky_top_shutterstock_q8775b.jpg", // Houston skyline
    outdoors: "https://buffalobayou.org/wp-content/uploads/2023/03/Image-232.jpg" // Buffalo Bayou Park
  },
  "washington": {
    sights: "https://upload.wikimedia.org/wikipedia/commons/9/9f/DC_monument_view_from_Lincoln_memorial.jpg",
        outdoors: "https://media.istockphoto.com/id/1791713023/photo/national-mall-washington-dc.jpg?s=612x612&w=0&k=20&c=6R4w41uT5qaA63Mb_1gz1TspQfy4s4GwT3YWf8oIzGo=" // National Mall reflecting pool
  },
  "london": {
    sights: "https://images.pexels.com/photos/29989521/pexels-photo-29989521/free-photo-of-iconic-london-big-ben-and-westminster-bridge-scene.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // Big Ben & Thames
    outdoors: "https://thumbs.dreamstime.com/b/beautiful-scenery-scenic-gardenscape-huntress-fountain-hyde-park-london-united-kingdom-summer-scenic-gardenscape-153907407.jpg" // Hyde Park
  },
  "paris": {
    sights: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1330333492430969", // Eiffel Tower sunset
    outdoors: "https://images.contentstack.io/v3/assets/blt06f605a34f1194ff/blt40ae634f566c5b74/681a6867b55bf32e3f07f4c8/iStock-2027474505-_HEADER_MOBILE.jpg?fit=crop&disable=upscale&auto=webp&quality=60&crop=smart" // Seine River bridges
  },
  "tokyo": {
    sights: "https://aglobewelltravelled.com/wp-content/uploads/2025/05/Tokyo-Skytree-vs-Tokyo-Tower.jpg", // Tokyo skyline with towers
    outdoors: "https://www.japan-guide.com/g18/3034_001_01.jpg" // Shinjuku Gyoen garden
  },
  "singapore": {
    sights: "https://earthshotprize.org/wp-content/uploads/2023/11/green-lightup-marina-bay.jpg", // Marina Bay Sands skyline
    outdoors: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Supertree_Grove%2C_Gardens_by_the_Bay%2C_Singapore_-_20120712-02.jpg" // Supertrees at Gardens by the Bay
  },
  "berlin": {
    sights: "https://d2i7eq829tbbje.cloudfront.net/webp/medium/Berlin_TV_Tower_3_P_4152_9cf598ac-aa91-4d2b-8821-6e7928da1716", // Brandenburg Gate & TV Tower
    outdoors: "https://images.squarespace-cdn.com/content/v1/62f74eae268c635eaa1823cc/1709553080303-02XIA7MZ7SEV7XGQVMON/Tiergarten.jpg" // Tiergarten park
  },
  "dubai": {
    sights: "https://thumbs.dreamstime.com/b/iconic-dubai-cityscape-night-burj-khalifa-starry-sky-breathtaking-panoramic-view-modern-dubai-skyline-398228525.jpg", // Burj Khalifa at night
    outdoors: "https://media.tacdn.com/media/attractions-splice-spp-674x446/09/99/99/87.jpg" // Desert safari scene
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

