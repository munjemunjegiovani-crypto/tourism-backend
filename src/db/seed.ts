/**
 * Development seed data: Cameroon's 4 launch regions, real attractions and DEMO businesses.
 * - Attraction coordinates are approximate; check them before going live.
 * - Every business here is fictional (names start with "Demo") — replace with real listings.
 * Safe to run several times: rows are upserted by slug.
 *
 * Run: npm run db:seed
 */
import { sql } from "drizzle-orm";
import { db, sqlClient } from "./client.js";
import { attractions, businesses, categories, cities, countries, regions } from "./schema.js";

const pt = (lat: number, lng: number) => ({ x: lng, y: lat });

/**
 * Photo from Wikimedia Commons (free licence; the photographer must be credited).
 * Special:FilePath serves the file at the requested width; the credit links to the
 * file page, which shows the author and licence.
 */
const commons = (file: string) => ({
  coverImageUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`,
  coverImageCredit: "Wikimedia Commons",
  coverImageSourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
});
const noPhoto = { coverImageUrl: null, coverImageCredit: null, coverImageSourceUrl: null };

async function upsertReturningIds<T extends { slug: string }>(
  table: typeof regions | typeof cities | typeof attractions | typeof businesses | typeof countries,
  rows: T[],
) {
  const result = await db
    .insert(table)
    .values(rows as never)
    .onConflictDoUpdate({
      target: table.slug,
      set: Object.fromEntries(
        Object.keys(rows[0])
          .filter((k) => k !== "slug")
          .map((k) => [k, sql.raw(`excluded."${toSnake(k)}"`)]),
      ),
    })
    .returning({ id: table.id, slug: table.slug });
  return new Map(result.map((r) => [r.slug, r.id]));
}

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

async function main() {
  const countryIds = await upsertReturningIds(countries, [
    { slug: "cameroon", isoCode: "CM", nameEn: "Cameroon", nameFr: "Cameroun", currency: "XAF" },
  ]);
  const cm = countryIds.get("cameroon")!;

  const regionIds = await upsertReturningIds(regions, [
    { slug: "south", countryId: cm, nameEn: "South", nameFr: "Sud" },
    { slug: "south-west", countryId: cm, nameEn: "South-West", nameFr: "Sud-Ouest" },
    { slug: "west", countryId: cm, nameEn: "West", nameFr: "Ouest" },
    { slug: "far-north", countryId: cm, nameEn: "Far North", nameFr: "Extrême-Nord" },
  ]);
  const r = (slug: string) => regionIds.get(slug)!;

  const cityIds = await upsertReturningIds(cities, [
    { slug: "kribi", regionId: r("south"), name: "Kribi", location: pt(2.9395, 9.91) },
    { slug: "limbe", regionId: r("south-west"), name: "Limbe", location: pt(4.0167, 9.2) },
    { slug: "buea", regionId: r("south-west"), name: "Buea", location: pt(4.156, 9.241) },
    { slug: "foumban", regionId: r("west"), name: "Foumban", location: pt(5.727, 10.9) },
    { slug: "dschang", regionId: r("west"), name: "Dschang", location: pt(5.45, 10.053) },
    { slug: "waza", regionId: r("far-north"), name: "Waza", location: pt(11.39, 14.57) },
    { slug: "rhumsiki", regionId: r("far-north"), name: "Rhumsiki", location: pt(10.514, 13.597) },
  ]);
  const c = (slug: string) => cityIds.get(slug)!;

  // Categories have a composite unique key (type, slug), so they are inserted separately
  const categoryRows = [
    { type: "attraction", slug: "beach", nameEn: "Beach", nameFr: "Plage", icon: "beach" },
    { type: "attraction", slug: "waterfall", nameEn: "Waterfall", nameFr: "Chute d'eau", icon: "waterfall" },
    { type: "attraction", slug: "national-park", nameEn: "National park", nameFr: "Parc national", icon: "park" },
    { type: "attraction", slug: "mountain", nameEn: "Mountain", nameFr: "Montagne", icon: "mountain" },
    { type: "attraction", slug: "museum", nameEn: "Museum & heritage", nameFr: "Musée & patrimoine", icon: "museum" },
    { type: "attraction", slug: "nature", nameEn: "Nature & wildlife", nameFr: "Nature & faune", icon: "leaf" },
    { type: "attraction", slug: "landmark", nameEn: "Landmark", nameFr: "Site remarquable", icon: "landmark" },
    { type: "business", slug: "hotel", nameEn: "Hotel", nameFr: "Hôtel", icon: "bed" },
    { type: "business", slug: "restaurant", nameEn: "Restaurant", nameFr: "Restaurant", icon: "utensils" },
    { type: "business", slug: "guide", nameEn: "Guide & tours", nameFr: "Guide & excursions", icon: "compass" },
  ] as const;
  const cats = await db
    .insert(categories)
    .values([...categoryRows])
    .onConflictDoUpdate({
      target: [categories.type, categories.slug],
      set: { nameEn: sql`excluded.name_en`, nameFr: sql`excluded.name_fr`, icon: sql`excluded.icon` },
    })
    .returning({ id: categories.id, type: categories.type, slug: categories.slug });
  const cat = (type: "attraction" | "business", slug: string) =>
    cats.find((x) => x.type === type && x.slug === slug)!.id;

  await upsertReturningIds(attractions, [
    {
      slug: "lobe-falls",
      ...commons("Chutes_de_la_Lobe.jpg"),
      name: "Lobé Falls",
      cityId: c("kribi"),
      categoryId: cat("attraction", "waterfall"),
      location: pt(2.877, 9.898),
      summaryEn: "A rare waterfall that drops straight into the Atlantic Ocean, south of Kribi.",
      summaryFr: "Une chute d'eau rare qui se jette directement dans l'océan Atlantique, au sud de Kribi.",
      bestSeason: "November to February",
      status: "published",
    },
    {
      slug: "kribi-beach",
      ...commons("Beach_of_Kribi,_Cameroon.jpg"),
      name: "Kribi Beach",
      cityId: c("kribi"),
      categoryId: cat("attraction", "beach"),
      location: pt(2.945, 9.905),
      summaryEn: "Long sandy beaches lined with palms and fresh seafood stalls.",
      summaryFr: "De longues plages de sable bordées de palmiers et d'étals de fruits de mer.",
      bestSeason: "November to March",
      status: "published",
    },
    {
      slug: "limbe-wildlife-centre",
      ...noPhoto,
      name: "Limbe Wildlife Centre",
      cityId: c("limbe"),
      categoryId: cat("attraction", "nature"),
      location: pt(4.0115, 9.2007),
      summaryEn: "A sanctuary caring for rescued primates and other wildlife.",
      summaryFr: "Un sanctuaire qui accueille des primates et d'autres animaux sauvés.",
      status: "published",
    },
    {
      slug: "limbe-botanic-garden",
      ...commons("Botanic_garden_limbe.jpg"),
      name: "Limbe Botanic Garden",
      cityId: c("limbe"),
      categoryId: cat("attraction", "nature"),
      location: pt(4.013, 9.204),
      summaryEn: "Historic botanic garden by the sea with trails and tropical plants.",
      summaryFr: "Jardin botanique historique au bord de la mer, avec sentiers et plantes tropicales.",
      status: "published",
    },
    {
      slug: "mount-cameroon",
      ...commons("Mount_fako_(mount_Cameroon).jpg"),
      name: "Mount Cameroon",
      cityId: c("buea"),
      categoryId: cat("attraction", "mountain"),
      location: pt(4.203, 9.17),
      summaryEn: "An active volcano and the highest peak in West and Central Africa; treks start from Buea.",
      summaryFr: "Volcan actif et plus haut sommet d'Afrique de l'Ouest et centrale ; les randonnées partent de Buea.",
      bestSeason: "November to April (dry season)",
      status: "published",
    },
    {
      slug: "foumban-royal-palace",
      ...commons("Bamun_sultan_palace.jpg"),
      name: "Royal Palace of Foumban",
      cityId: c("foumban"),
      categoryId: cat("attraction", "museum"),
      location: pt(5.729, 10.901),
      summaryEn: "Seat of the Bamoun kingdom, with a museum of royal history and art.",
      summaryFr: "Siège du royaume Bamoun, avec un musée d'histoire et d'art royal.",
      status: "published",
    },
    {
      slug: "lake-dschang",
      ...commons("Le_Lac_municipal_de_DSCHANG.jpg"),
      name: "Lake Dschang",
      cityId: c("dschang"),
      categoryId: cat("attraction", "nature"),
      location: pt(5.447, 10.056),
      summaryEn: "A calm lake in the cool highlands of the West region.",
      summaryFr: "Un lac paisible dans les hautes terres fraîches de l'Ouest.",
      status: "published",
    },
    {
      slug: "waza-national-park",
      ...noPhoto,
      name: "Waza National Park",
      cityId: c("waza"),
      categoryId: cat("attraction", "national-park"),
      location: pt(11.33, 14.65),
      summaryEn: "Savanna park in the Far North known for elephants, giraffes and birdlife.",
      summaryFr: "Parc de savane de l'Extrême-Nord, connu pour ses éléphants, girafes et oiseaux.",
      bestSeason: "December to April",
      status: "published",
    },
    {
      slug: "rhumsiki-peak",
      ...commons("Rhumsiki_with_Kapsiki_Peak_(after_sunrise),_Far_North_Province_of_Cameroon.jpg"),
      name: "Rhumsiki Peak",
      cityId: c("rhumsiki"),
      categoryId: cat("attraction", "landmark"),
      location: pt(10.513, 13.595),
      summaryEn: "Dramatic volcanic plugs in the Mandara Mountains, popular for hikes and views.",
      summaryFr: "Pitons volcaniques spectaculaires dans les monts Mandara, prisés pour la randonnée.",
      status: "published",
    },
  ]);

  // DEMO businesses — fictional, for development only
  const demo = (o: {
    slug: string;
    name: string;
    city: string;
    category: string;
    lat: number;
    lng: number;
    priceRange?: "$" | "$$" | "$$$" | "$$$$";
    plan?: "free" | "pro" | "premium";
  }) => ({
    slug: o.slug,
    name: o.name,
    cityId: c(o.city),
    categoryId: cat("business", o.category),
    location: pt(o.lat, o.lng),
    description: "Demo listing for development. Replace with a real business.",
    priceRange: o.priceRange ?? null,
    plan: o.plan ?? "free",
    website: "https://example.com",
    status: "published" as const,
  });

  await upsertReturningIds(businesses, [
    demo({ slug: "demo-kribi-beach-hotel", name: "Demo Kribi Beach Hotel", city: "kribi", category: "hotel", lat: 2.94, lng: 9.908, priceRange: "$$", plan: "pro" }),
    demo({ slug: "demo-kribi-seafood-grill", name: "Demo Kribi Seafood Grill", city: "kribi", category: "restaurant", lat: 2.942, lng: 9.9095, priceRange: "$" }),
    demo({ slug: "demo-lobe-falls-lodge", name: "Demo Lobé Falls Lodge", city: "kribi", category: "hotel", lat: 2.88, lng: 9.9, priceRange: "$$$" }),
    demo({ slug: "demo-limbe-seaview-hotel", name: "Demo Limbe Seaview Hotel", city: "limbe", category: "hotel", lat: 4.015, lng: 9.202, priceRange: "$$" }),
    demo({ slug: "demo-buea-mountain-guides", name: "Demo Buea Mountain Guides", city: "buea", category: "guide", lat: 4.158, lng: 9.24, plan: "pro" }),
    demo({ slug: "demo-foumban-heritage-inn", name: "Demo Foumban Heritage Inn", city: "foumban", category: "hotel", lat: 5.73, lng: 10.903, priceRange: "$" }),
    demo({ slug: "demo-rhumsiki-trek-guide", name: "Demo Rhumsiki Trek Guide", city: "rhumsiki", category: "guide", lat: 10.515, lng: 13.597 }),
  ]);

  console.log("Seed complete: 1 country, 4 regions, 7 cities, 10 categories, 9 attractions, 7 demo businesses.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sqlClient.end());
