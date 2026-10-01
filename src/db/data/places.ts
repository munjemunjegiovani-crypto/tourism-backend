/**
 * Places near destinations.
 * - Real places (airports, markets) have no rating: we don't invent scores for real businesses.
 * - Hotels and restaurants are generated DEMO listings (names start with "Demo") until real
 *   businesses join the platform.
 */
import type { DestinationSeed } from "./types.js";

export type PlaceSeed = {
  slug: string;
  kind: "hotel" | "restaurant" | "shopping" | "transport";
  name: string;
  country: string;
  city?: string;
  description: string;
  lat: number;
  lng: number;
  rating?: number;
  priceRange?: string;
  website?: string;
  isDemo?: boolean;
  plan?: "free" | "pro" | "premium";
};

export const realPlaces: PlaceSeed[] = [
  // Airports
  { slug: "douala-international-airport", kind: "transport", name: "Douala International Airport", country: "cameroon", city: "douala", description: "Cameroon's main international airport.", lat: 4.0061, lng: 9.7195 },
  { slug: "yaounde-nsimalen-airport", kind: "transport", name: "Yaoundé Nsimalen International Airport", country: "cameroon", city: "yaounde", description: "International airport serving the capital.", lat: 3.7226, lng: 11.5533 },
  { slug: "jomo-kenyatta-airport", kind: "transport", name: "Jomo Kenyatta International Airport", country: "kenya", city: "nairobi", description: "Nairobi's international airport and East Africa's busiest hub.", lat: -1.3192, lng: 36.9278 },
  { slug: "moi-international-airport", kind: "transport", name: "Moi International Airport", country: "kenya", city: "mombasa", description: "Airport for Mombasa and the south coast beaches.", lat: -4.0348, lng: 39.5942 },
  { slug: "kilimanjaro-international-airport", kind: "transport", name: "Kilimanjaro International Airport", country: "tanzania", city: "moshi", description: "Gateway for Kilimanjaro climbs and northern safaris.", lat: -3.4294, lng: 37.0745 },
  { slug: "zanzibar-airport", kind: "transport", name: "Abeid Amani Karume International Airport", country: "tanzania", city: "stone-town", description: "Zanzibar's international airport.", lat: -6.222, lng: 39.2249 },
  { slug: "cape-town-international-airport", kind: "transport", name: "Cape Town International Airport", country: "south-africa", city: "cape-town", description: "Main airport for Cape Town and the Western Cape.", lat: -33.9715, lng: 18.6021 },
  { slug: "or-tambo-airport", kind: "transport", name: "O. R. Tambo International Airport", country: "south-africa", city: "johannesburg", description: "Johannesburg's international hub.", lat: -26.1392, lng: 28.246 },
  { slug: "marrakesh-menara-airport", kind: "transport", name: "Marrakesh Menara Airport", country: "morocco", city: "marrakech", description: "Airport for Marrakech and the Atlas.", lat: 31.6069, lng: -8.0363 },
  { slug: "cairo-international-airport", kind: "transport", name: "Cairo International Airport", country: "egypt", city: "cairo", description: "Egypt's main international airport.", lat: 30.1219, lng: 31.4056 },
  { slug: "luxor-international-airport", kind: "transport", name: "Luxor International Airport", country: "egypt", city: "luxor", description: "Airport for Luxor's temples and tombs.", lat: 25.671, lng: 32.7066 },
  { slug: "kigali-international-airport", kind: "transport", name: "Kigali International Airport", country: "rwanda", city: "kigali", description: "Rwanda's international airport.", lat: -1.9686, lng: 30.1395 },
  { slug: "kotoka-international-airport", kind: "transport", name: "Kotoka International Airport", country: "ghana", city: "accra", description: "Accra's international airport.", lat: 5.6052, lng: -0.1668 },
  { slug: "murtala-muhammed-airport", kind: "transport", name: "Murtala Muhammed International Airport", country: "nigeria", city: "lagos", description: "Lagos's international airport.", lat: 6.5774, lng: 3.3212 },
  { slug: "hosea-kutako-airport", kind: "transport", name: "Hosea Kutako International Airport", country: "namibia", city: "windhoek", description: "Namibia's main international airport near Windhoek.", lat: -22.4799, lng: 17.4709 },
  { slug: "blaise-diagne-airport", kind: "transport", name: "Blaise Diagne International Airport", country: "senegal", city: "dakar", description: "Dakar's international airport.", lat: 14.67, lng: -17.0733 },
  { slug: "victoria-falls-airport", kind: "transport", name: "Victoria Falls Airport", country: "zimbabwe", city: "victoria-falls-town", description: "Airport for Victoria Falls.", lat: -18.0959, lng: 25.839 },
  // Markets
  { slug: "marche-mokolo", kind: "shopping", name: "Marché Mokolo", country: "cameroon", city: "yaounde", description: "One of the largest and busiest markets in Yaoundé.", lat: 3.877, lng: 11.502 },
  { slug: "khan-el-khalili", kind: "shopping", name: "Khan el-Khalili", country: "egypt", city: "cairo", description: "Historic bazaar in Islamic Cairo, dating back to the 14th century.", lat: 30.0477, lng: 31.2623 },
  { slug: "souks-of-marrakech", kind: "shopping", name: "Souks of Marrakech", country: "morocco", city: "marrakech", description: "Maze of market streets north of Jemaa el-Fnaa.", lat: 31.6302, lng: -7.9875 },
  { slug: "makola-market", kind: "shopping", name: "Makola Market", country: "ghana", city: "accra", description: "Accra's huge central market.", lat: 5.5476, lng: -0.2087 },
  { slug: "kermel-market", kind: "shopping", name: "Kermel Market", country: "senegal", city: "dakar", description: "Covered market in central Dakar for food, flowers and crafts.", lat: 14.6697, lng: -17.4325 },
  { slug: "kimironko-market", kind: "shopping", name: "Kimironko Market", country: "rwanda", city: "kigali", description: "Kigali's biggest market, known for fabric and tailors.", lat: -1.9497, lng: 30.1263 },
  { slug: "darajani-market", kind: "shopping", name: "Darajani Market", country: "tanzania", city: "stone-town", description: "Stone Town's main market for spices, fruit and fish.", lat: -6.1615, lng: 39.1934 },
  { slug: "greenmarket-square", kind: "shopping", name: "Greenmarket Square", country: "south-africa", city: "cape-town", description: "Cobbled square with craft and curio stalls.", lat: -33.9223, lng: 18.4198 },
  { slug: "lekki-arts-crafts-market", kind: "shopping", name: "Lekki Arts and Crafts Market", country: "nigeria", city: "lagos", description: "Large market for Nigerian art, fabrics and crafts.", lat: 6.4426, lng: 3.4737 },
];

/** Deterministic pseudo-random numbers, so the seed gives the same demo data every time. */
export function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const hotelNames = ["Lodge", "Garden Hotel", "View Hotel", "Guesthouse", "Eco Camp", "Boutique Hotel"];
const restaurantNames = ["Kitchen", "Grill", "Terrace", "Café", "Market Table", "Bistro"];

/** One demo hotel and one demo restaurant near each featured or popular destination. */
export function demoPlacesFor(destinations: DestinationSeed[]): PlaceSeed[] {
  const out: PlaceSeed[] = [];
  for (const d of destinations) {
    if ((d.popularity ?? 0) < 60) continue;
    const r = rng(d.slug);
    const base = d.name.replace(/ (National Park|National Reserve|Temple Complex|Temples|Beaches|Beach)$/, "");
    const near = () => ({ lat: d.lat + (r() - 0.5) * 0.04, lng: d.lng + (r() - 0.5) * 0.04 });
    const rating = () => Math.round((3.9 + r() * 0.9) * 10) / 10;
    const price = () => ["$", "$$", "$$$"][Math.floor(r() * 3)];
    out.push({
      slug: `demo-${d.slug}-hotel`,
      kind: "hotel",
      name: `Demo ${base} ${hotelNames[Math.floor(r() * hotelNames.length)]}`,
      country: d.country,
      city: d.city,
      description: "Fictional sample listing for development. Real hotels can claim and replace it.",
      ...near(),
      rating: rating(),
      priceRange: price(),
      website: "https://example.com",
      isDemo: true,
      plan: r() > 0.75 ? "pro" : "free",
    });
    out.push({
      slug: `demo-${d.slug}-restaurant`,
      kind: "restaurant",
      name: `Demo ${base} ${restaurantNames[Math.floor(r() * restaurantNames.length)]}`,
      country: d.country,
      city: d.city,
      description: "Fictional sample listing for development. Real restaurants can claim and replace it.",
      ...near(),
      rating: rating(),
      priceRange: price(),
      isDemo: true,
    });
  }
  return out;
}
