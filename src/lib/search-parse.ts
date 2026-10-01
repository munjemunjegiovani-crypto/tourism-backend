/**
 * Turns natural search phrases into structured filters.
 *   "waterfalls near Douala"   → type: waterfall, near: Douala
 *   "beaches in Cameroon"      → category: beaches, in: Cameroon
 *   "things to do in Nairobi"  → activities around Nairobi
 *   "Kenya"                    → place: Kenya
 * Places (countries, cities, destinations) are matched against the database.
 */
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { normalize, type LatLng } from "./destinations.js";

export type SearchType = {
  label: string;
  category?: string;
  tag?: string[];
  placeKind?: "hotel" | "restaurant" | "shopping" | "transport";
};

export type SearchPlace = {
  kind: "country" | "city" | "destination";
  slug: string;
  name: string;
  countrySlug: string;
  location: LatLng;
};

export type ParsedSearch = {
  raw: string;
  intent: "browse" | "things-to-do";
  type?: SearchType;
  place?: SearchPlace;
  relation?: "in" | "near";
  text?: string; // words left over for a free-text match
};

/** Search words → what to look for. Plurals are handled by stripping a trailing "s"/"es". */
const TYPES: [string[], SearchType][] = [
  [["waterfall", "falls", "cascade", "chute"], { label: "Waterfalls", tag: ["waterfall"] }],
  [["beach", "beache", "coast", "seaside", "plage"], { label: "Beaches", category: "beaches" }],
  [["mountain", "peak", "volcano", "volcanoe", "hike", "hiking", "trek", "trekking"], { label: "Mountains", category: "mountains" }],
  [["national park", "park", "reserve"], { label: "National parks", tag: ["national-park"] }],
  [["museum", "gallery"], { label: "Museums", tag: ["museum"] }],
  [["wildlife", "safari", "animal", "game drive", "big five"], { label: "Wildlife", category: "wildlife" }],
  [["gorilla", "chimpanzee", "primate", "monkey"], { label: "Primates", tag: ["gorillas", "primates", "chimpanzees"] }],
  [["culture", "cultural", "tradition", "festival"], { label: "Culture", category: "culture" }],
  [["history", "historical", "historic", "ruin", "monument", "castle", "fort", "temple", "pyramid"], { label: "Historical sites", category: "historical" }],
  [["desert", "dune", "sahara"], { label: "Deserts", tag: ["desert", "dunes"] }],
  [["lake"], { label: "Lakes", tag: ["lake"] }],
  [["island"], { label: "Islands", tag: ["island"] }],
  [["adventure"], { label: "Adventure", category: "adventure" }],
  [["art", "artist"], { label: "Art", category: "art" }],
  [["city", "citie", "town"], { label: "Cities", category: "cities" }],
  [["nature", "forest", "rainforest"], { label: "Nature", category: "nature" }],
  [["hotel", "lodge", "accommodation", "stay", "where to stay"], { label: "Hotels", placeKind: "hotel" }],
  [["restaurant", "food", "where to eat", "eat"], { label: "Restaurants", placeKind: "restaurant" }],
  [["market", "shopping", "shop"], { label: "Shopping", placeKind: "shopping" }],
  [["airport"], { label: "Airports", placeKind: "transport" }],
];

const singular = (w: string) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");

function findType(phrase: string): SearchType | undefined {
  const p = normalize(phrase);
  const sing = p.split(/\s+/).map(singular).join(" ");
  for (const [words, type] of TYPES) {
    if (words.some((w) => p === w || sing === w || p === `${w}s` || sing.endsWith(` ${w}`) || sing.startsWith(`${w} `))) return type;
  }
  return undefined;
}

/** Common alternative names travellers type. */
const ALIASES: Record<string, string> = {
  zanzibar: "stone-town",
  kilimanjaro: "mount-kilimanjaro",
  "victoria falls": "victoria-falls",
  "cape town": "cape-town",
  "ivory coast": "cote-divoire",
  drc: "dr-congo",
  congo: "congo",
  giza: "pyramids-of-giza",
  pyramids: "pyramids-of-giza",
  "maasai mara": "maasai-mara",
  "masai mara": "maasai-mara",
  mara: "maasai-mara",
  yaounde: "yaounde",
};

let placeCache: { at: number; list: (SearchPlace & { key: string })[] } | null = null;

/** All countries, cities and destinations, cached for 5 minutes. */
export async function allPlaces() {
  if (placeCache && Date.now() - placeCache.at < 300_000) return placeCache.list;
  const rows = await db.execute<{ kind: SearchPlace["kind"]; slug: string; name: string; country_slug: string; lat: number; lng: number }>(sql`
    SELECT 'country' AS kind, slug, name, slug AS country_slug, ST_Y(location) AS lat, ST_X(location) AS lng FROM countries
    UNION ALL
    SELECT 'city', ci.slug, ci.name, co.slug, ST_Y(ci.location), ST_X(ci.location) FROM cities ci JOIN countries co ON co.id = ci.country_id
    UNION ALL
    SELECT 'destination', d.slug, d.name, co.slug, ST_Y(d.location), ST_X(d.location) FROM destinations d JOIN countries co ON co.id = d.country_id
  `);
  const list = rows.map((r) => ({
    kind: r.kind,
    slug: r.slug,
    name: r.name,
    countrySlug: r.country_slug,
    location: { lat: Number(r.lat), lng: Number(r.lng) },
    key: normalize(r.name),
  }));
  placeCache = { at: Date.now(), list };
  return list;
}

const kindRank = { country: 0, city: 1, destination: 2 } as const;

/** Find a country, city or destination by name, slug or alias. Countries win ties. */
export async function findPlace(phrase: string, { exactOnly = false } = {}): Promise<SearchPlace | undefined> {
  const p = normalize(phrase).replace(/^the /, "");
  if (!p) return undefined;
  const list = await allPlaces();
  const alias = ALIASES[p];
  const exact = list
    .filter((x) => x.key === p || x.slug === p || x.slug === alias || x.key.replace(/^(mount|lake|the) /, "") === p)
    .sort((a, b) => kindRank[a.kind] - kindRank[b.kind]);
  if (exact[0]) return strip(exact[0]);
  if (exactOnly) return undefined;
  // Starts-with match, e.g. "dschang" → "Lake Dschang"? prefer names that start with the phrase
  const partial = list
    .filter((x) => p.length >= 4 && (x.key.startsWith(p) || x.key.includes(` ${p}`)))
    .sort((a, b) => kindRank[a.kind] - kindRank[b.kind] || a.key.length - b.key.length);
  return partial[0] ? strip(partial[0]) : undefined;
}

const strip = ({ key: _key, ...p }: SearchPlace & { key: string }): SearchPlace => p;

export async function parseSearch(raw: string): Promise<ParsedSearch> {
  const q = normalize(raw).replace(/[?!.]+$/, "").replace(/\s+/g, " ");
  const out: ParsedSearch = { raw, intent: "browse" };
  if (!q) return out;

  // "things to do in X", "what to do around X", "activities in X"
  const todo = q.match(/^(?:things|stuff|what) to do(?: (?:in|around|near|at))? (.+)$/) ?? q.match(/^activities (?:in|around|near) (.+)$/);
  if (todo) {
    out.intent = "things-to-do";
    out.place = await findPlace(todo[1]);
    out.relation = out.place?.kind === "country" ? "in" : "near";
    if (!out.place) out.text = todo[1];
    return out;
  }

  // "<type> near <place>" / "<type> in <place>"
  const rel = q.match(/^(.+?) (near|around|close to|in|at|of) (.+)$/);
  if (rel) {
    const type = findType(rel[1]);
    const place = await findPlace(rel[3]);
    if (type || place) {
      out.type = type;
      out.place = place;
      out.relation = rel[2] === "in" || rel[2] === "of" || rel[2] === "at" ? "in" : "near";
      // "in <city>" works best as a radius search; "in <country>" as a filter
      if (place && place.kind !== "country") out.relation = "near";
      if (!type) out.text = rel[1];
      if (!place) out.text = [out.text, rel[3]].filter(Boolean).join(" ");
      return out;
    }
  }

  // A known place name or alias on its own ("Kenya", "pyramids", "Zanzibar")
  const exactPlace = await findPlace(q, { exactOnly: true });
  if (exactPlace) return { ...out, place: exactPlace, relation: exactPlace.kind === "country" ? "in" : "near" };

  // "<place> <type>" ("cameroon beaches") or "<type> <place>" ("beaches kribi")
  const words = q.split(" ");
  for (let i = 1; i < words.length; i++) {
    const [a, b] = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const pa = await findPlace(a, { exactOnly: true });
    const tb = findType(b);
    if (pa && tb) return { ...out, place: pa, type: tb, relation: pa.kind === "country" ? "in" : "near" };
    const ta = findType(a);
    const pb = await findPlace(b, { exactOnly: true });
    if (ta && pb) return { ...out, place: pb, type: ta, relation: pb.kind === "country" ? "in" : "near" };
  }

  // Just a type ("waterfalls"), or a partial place name ("kili")
  const type = findType(q);
  if (type) return { ...out, type };
  const place = await findPlace(q);
  if (place) return { ...out, place, relation: place.kind === "country" ? "in" : "near" };
  return { ...out, text: q };
}
