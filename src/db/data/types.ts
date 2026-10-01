/** Destination seed type shared by the per-region data files. */
export type DestinationSeed = {
  slug: string;
  name: string;
  country: string; // country slug
  city?: string; // city slug
  category: string; // category slug
  tags?: string[]; // search words: waterfall, national-park, museum, island, volcano, desert, lake…
  summary: string;
  description: string;
  highlights?: string[];
  lat: number;
  lng: number;
  openingHours?: string;
  priceRange?: "Free" | "$" | "$$" | "$$$";
  budget?: string;
  bestTime?: string;
  bestMonths?: number[];
  duration?: string;
  difficulty?: "easy" | "moderate" | "difficult";
  popularity?: number;
  featured?: boolean;
  wiki?: string; // Wikipedia article title for photos
  photos?: string[]; // Wikimedia Commons file names checked by hand (used before wiki photos)
  activities?: (string | [string, string])[]; // activity slug, or [slug, destination-specific note]
};

export const months = {
  dry: [11, 12, 1, 2],
  dryLong: [11, 12, 1, 2, 3],
  eastAfricaDry: [6, 7, 8, 9, 10, 1, 2],
  southernWinter: [5, 6, 7, 8, 9, 10],
  northMild: [3, 4, 5, 9, 10, 11],
  egyptWinter: [10, 11, 12, 1, 2, 3, 4],
  allYear: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};
