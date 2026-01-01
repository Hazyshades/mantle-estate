import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ImageUrl {
  city: string;
  type: 'card' | 'sights' | 'outdoors';
  url: string;
  index?: number; // для массивов sights
}

const imagesDir = path.join(__dirname, '../public/images');

// Создаем папку если её нет
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Все URL изображений
const imageUrls: ImageUrl[] = [
  // Card images
  { city: 'new york', type: 'card', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'miami', type: 'card', url: 'https://www.miamiandbeaches.com/getmedia/9d5a6543-44ad-4279-84bb-cfd10059e57e/Skywheel_Miami_1440x900.jpg' },
  { city: 'los angeles', type: 'card', url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'chicago', type: 'card', url: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'philadelphia', type: 'card', url: 'https://images.unsplash.com/photo-1508770218424-753a10cd8117?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'dallas', type: 'card', url: 'https://images.unsplash.com/photo-1653862496605-e994e87392ec?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'houston', type: 'card', url: 'https://images.unsplash.com/photo-1629924887151-3a7494ff0334?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'washington', type: 'card', url: 'https://images.unsplash.com/photo-1617581629397-a72507c3de9e?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'london', type: 'card', url: 'https://offloadmedia.feverup.com/secretldn.com/wp-content/uploads/2022/06/25124714/shutterstock_2079973213-1-1024x657.jpg' },
  { city: 'paris', type: 'card', url: 'https://meet-thelocals.com/wp-content/uploads/2019/10/Eiffel-Tower-view-Paris-1024x683.jpg' },
  { city: 'tokyo', type: 'card', url: 'https://images.unsplash.com/photo-1557409518-1b1ad1ac120d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'singapore', type: 'card', url: 'https://www.traveltalktours.com/wp-content/smush-webp/2023/12/guo-xin-goh-8juRlGCr5c-unsplash-1-scaled.jpg.webp' },
  { city: 'berlin', type: 'card', url: 'https://images.squarespace-cdn.com/content/v1/6885522713c6cd559686b2fd/48e0b35f-4b5f-4252-b45b-547eabfbc3b4/berlin-skyline-sunset-berliner-dom.jpg' },
  { city: 'dubai', type: 'card', url: 'https://images.locationscout.net/2021/05/the-best-view-of-dubai-united-arab-emirates.webp?h=1400&q=80' },
  { city: 'hong kong', type: 'card', url: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'shanghai', type: 'card', url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'sydney', type: 'card', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'seoul', type: 'card', url: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  
  // City images - sights
  { city: 'new york', type: 'sights', url: 'https://scontent-lga3-2.xx.fbcdn.net/v/t39.30808-6/494721079_1453556805907483_7715653555555023016_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=KlK9ru8jMKAQ7kNvwHxwv0X&_nc_oc=AdklWoi4aZDkzFyWl4PvoKgaqreq6Jh-GzOmq6T9M4FtKOW1XeppTUAMxjfkFuI71Pc&_nc_zt=23&_nc_ht=scontent-lga3-2.xx&_nc_gid=0qhbuV1EjNPgJGaLMpKN8A&oh=00_AfkY4Kt4-UYgUIyC6mqFboeCP6FY4BvKCjKkPpXOdApHAA&oe=694B8FC1', index: 0 },
  { city: 'miami', type: 'sights', url: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/sunset-above-downtown-miami-skyline-and-biscayne-bay-miroslav-liska.jpg' },
  { city: 'los angeles', type: 'sights', url: 'https://www.exp1.com/blog/wp-content/uploads/sites/7/2018/03/Hollywood-Sign-in-LA-with-pink-sky.jpg' },
  { city: 'chicago', type: 'sights', url: 'https://imgc.allpostersimages.com/img/posters/amanda-hall-chicago-skyline-and-lake-michigan-at-dusk-with-the-willis-tower-on-the-left-chicago-illinois-usa_u-l-pib29h0.jpg?artHeight=550&artPerspective=n&artWidth=550&background=ffffff' },
  { city: 'philadelphia', type: 'sights', url: 'https://thumbs.dreamstime.com/b/vibrant-cityscape-philadelphia-twilight-iconic-skyline-features-modern-skyscrapers-historic-architecture-413558443.jpg' },
  { city: 'dallas', type: 'sights', url: 'https://reuniontower.com/wp-content/uploads/2023/03/hero-1.jpg' },
  { city: 'houston', type: 'sights', url: 'https://res.cloudinary.com/sagacity/image/upload/c_crop,h_1200,w_1800,x_0,y_0/c_limit,dpr_auto,f_auto,fl_lossy,q_80,w_1200/sky_top_shutterstock_q8775b.jpg' },
  { city: 'washington', type: 'sights', url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/DC_monument_view_from_Lincoln_memorial.jpg' },
  { city: 'london', type: 'sights', url: 'https://images.pexels.com/photos/29989521/pexels-photo-29989521/free-photo-of-iconic-london-big-ben-and-westminster-bridge-scene.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { city: 'paris', type: 'sights', url: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1330333492430969' },
  { city: 'tokyo', type: 'sights', url: 'https://aglobewelltravelled.com/wp-content/uploads/2025/05/Tokyo-Skytree-vs-Tokyo-Tower.jpg' },
  { city: 'singapore', type: 'sights', url: 'https://earthshotprize.org/wp-content/uploads/2023/11/green-lightup-marina-bay.jpg' },
  { city: 'berlin', type: 'sights', url: 'https://d2i7eq829tbbje.cloudfront.net/webp/medium/Berlin_TV_Tower_3_P_4152_9cf598ac-aa91-4d2b-8821-6e7928da1716' },
  { city: 'dubai', type: 'sights', url: 'https://thumbs.dreamstime.com/b/iconic-dubai-cityscape-night-burj-khalifa-starry-sky-breathtaking-panoramic-view-modern-dubai-skyline-398228525.jpg' },
  { city: 'hong kong', type: 'sights', url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'shanghai', type: 'sights', url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'sydney', type: 'sights', url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'seoul', type: 'sights', url: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  
  // City images - outdoors
  { city: 'new york', type: 'outdoors', url: 'https://theinsatiabletraveler.com/wp-content/uploads/2015/11/Best-Places-to-see-Fall-Colors-in-Central-Park-4761.jpg' },
  { city: 'miami', type: 'outdoors', url: 'https://citytravelcompanion.com/wp-content/uploads/2024/06/vibrant_miami_beach_scene.jpg' },
  { city: 'los angeles', type: 'outdoors', url: 'https://www.travelcaffeine.com/wp-content/uploads/2016/11/griffith-observatory-los-angeles-skyline-low-dawn-blue-bricker.jpg' },
  { city: 'chicago', type: 'outdoors', url: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/8b/29/1e/one-of-our-favourite.jpg?w=900&h=-1&s=1' },
  { city: 'philadelphia', type: 'outdoors', url: 'https://accessglobal.media.clients.ellingtoncms.com/uploads/froala_editor/images/Fairmount%20Park%201.jpeg' },
  { city: 'dallas', type: 'outdoors', url: 'https://lakehighlands.advocatemag.com/wp-content/uploads/2018/09/1504290007_DannyFulgencio_AerialWhiteRockLake_ED_63.jpg' },
  { city: 'houston', type: 'outdoors', url: 'https://buffalobayou.org/wp-content/uploads/2023/03/Image-232.jpg' },
  { city: 'washington', type: 'outdoors', url: 'https://media.istockphoto.com/id/1791713023/photo/national-mall-washington-dc.jpg?s=612x612&w=0&k=20&c=6R4w41uT5qaA63Mb_1gz1TspQfy4s4GwT3YWf8oIzGo=' },
  { city: 'london', type: 'outdoors', url: 'https://thumbs.dreamstime.com/b/beautiful-scenery-scenic-gardenscape-huntress-fountain-hyde-park-london-united-kingdom-summer-scenic-gardenscape-153907407.jpg' },
  { city: 'paris', type: 'outdoors', url: 'https://images.contentstack.io/v3/assets/blt06f605a34f1194ff/blt40ae634f566c5b74/681a6867b55bf32e3f07f4c8/iStock-2027474505-_HEADER_MOBILE.jpg?fit=crop&disable=upscale&auto=webp&quality=60&crop=smart' },
  { city: 'tokyo', type: 'outdoors', url: 'https://www.japan-guide.com/g18/3034_001_01.jpg' },
  { city: 'singapore', type: 'outdoors', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Supertree_Grove%2C_Gardens_by_the_Bay%2C_Singapore_-_20120712-02.jpg' },
  { city: 'berlin', type: 'outdoors', url: 'https://images.squarespace-cdn.com/content/v1/62f74eae268c635eaa1823cc/1709553080303-02XIA7MZ7SEV7XGQVMON/Tiergarten.jpg' },
  { city: 'dubai', type: 'outdoors', url: 'https://media.tacdn.com/media/attractions-splice-spp-674x446/09/99/99/87.jpg' },
  { city: 'hong kong', type: 'outdoors', url: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'shanghai', type: 'outdoors', url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'sydney', type: 'outdoors', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { city: 'seoul', type: 'outdoors', url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
];

function getFileName(city: string, type: string, index?: number): string {
  const citySlug = city.replace(/\s+/g, '-');
  const indexSuffix = index !== undefined ? `-${index}` : '';
  // Определяем расширение из URL или используем jpg по умолчанию
  const url = imageUrls.find(img => img.city === city && img.type === type && img.index === index)?.url || '';
  let ext = 'jpg';
  if (url.includes('.webp')) ext = 'webp';
  else if (url.includes('.png')) ext = 'png';
  else if (url.includes('.jpeg')) ext = 'jpeg';
  return `${citySlug}-${type}${indexSuffix}.${ext}`;
}

async function downloadImage(url: string, filePath: string): Promise<void> {
  try {
    console.log(`Скачиваю: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    console.log(`✓ Сохранено: ${filePath}`);
  } catch (error) {
    console.error(`✗ Ошибка при скачивании ${url}:`, error);
  }
}

async function main() {
  console.log(`Скачиваю ${imageUrls.length} изображений в ${imagesDir}...\n`);
  
  for (const img of imageUrls) {
    const fileName = getFileName(img.city, img.type, img.index);
    const filePath = path.join(imagesDir, fileName);
    
    // Пропускаем если файл уже существует
    if (fs.existsSync(filePath)) {
      console.log(`⊘ Пропущено (уже существует): ${fileName}`);
      continue;
    }
    
    await downloadImage(img.url, filePath);
    // Небольшая задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✓ Завершено!');
}

main().catch(console.error);

