/**
 * Real destination photos from Wikipedia and Wikimedia Commons, with photographer credit.
 *   npm run db:images            (only destinations with fewer than 4 photos)
 *   npm run db:images -- --all   (refresh everything)
 *
 * How it works:
 *  1. For each destination with a `wiki_title`, read the photos used in its Wikipedia article
 *     (REST "media-list" endpoint), skipping maps, flags, logos and diagrams.
 *  2. Ask Wikimedia Commons for each file's author and licence. Files not on Commons
 *     (e.g. non-free images hosted only on Wikipedia) are skipped.
 *  3. Store up to 5 photos per destination. The URL is Commons' Special:FilePath, which can
 *     resize on the fly (?width=), so the website downloads small copies on phones.
 *
 * Needs internet access. Wikimedia asks API users to send a descriptive User-Agent.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, sqlClient } from "./client.js";
import { destinations, images } from "./schema.js";

const UA = `AfricaDiscover/1.0 (tourism platform; ${process.env.CONTACT_EMAIL ?? "contact via GitHub"})`;
const MAX_PHOTOS = 5;
// Wikimedia only serves thumbnails at fixed widths (330, 500, 960, 1280, 1920…); others get HTTP 429
const STORED_WIDTH = 1280;
const SKIP = /(map|locator|location|flag|coat[_ ]of[_ ]arms|logo|icon|diagram|relief|chart|graph|symbol|seal|emblem|signature|\.svg$|\.gif$|\.tif)/i;

export function commonsImage(file: string, alt: string) {
  const name = file.replace(/^File:/, "").replace(/ /g, "_");
  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${STORED_WIDTH}`,
    alt,
    credit: "Wikimedia Commons",
    license: null as string | null,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`,
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(40_000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json() as Promise<T>;
}

type MediaList = { items?: { title: string; type: string; leadImage?: boolean }[] };

/** Photo file names used in a Wikipedia article, lead image first. */
async function articlePhotos(title: string): Promise<string[]> {
  const data = await getJson<MediaList>(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  );
  const files = (data.items ?? [])
    .filter((i) => i.type === "image" && !SKIP.test(i.title))
    .sort((a, b) => Number(b.leadImage ?? false) - Number(a.leadImage ?? false))
    .map((i) => i.title.replace(/^File:/, ""));
  return [...new Set(files)];
}

type ImageInfo = {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        missing?: string;
        imageinfo?: { descriptionurl: string; extmetadata?: Record<string, { value: string }> }[];
      }
    >;
  };
};

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Author and licence for up to 50 Commons files. Files missing from Commons are left out. */
async function commonsCredits(files: string[]) {
  const out = new Map<string, { credit: string; license: string; sourceUrl: string }>();
  if (files.length === 0) return out;
  const titles = files.map((f) => `File:${f.replace(/_/g, " ")}`).join("|");
  const data = await getJson<ImageInfo>(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiextmetadatafilter=Artist|LicenseShortName&titles=${encodeURIComponent(titles)}`,
  );
  for (const page of Object.values(data.query?.pages ?? {})) {
    if (page.missing !== undefined || !page.imageinfo?.length) continue;
    const info = page.imageinfo[0];
    const artist = stripHtml(info.extmetadata?.Artist?.value ?? "") || "Unknown author";
    const license = stripHtml(info.extmetadata?.LicenseShortName?.value ?? "");
    out.set(page.title.replace(/^File:/, "").replace(/ /g, "_"), {
      credit: `${artist.slice(0, 120)} / Wikimedia Commons`,
      license,
      sourceUrl: info.descriptionurl,
    });
  }
  return out;
}

/** Older rows were stored with a width Wikimedia no longer serves. */
export async function fixStoredWidths() {
  await db.execute(sql`UPDATE images SET url = regexp_replace(url, 'width=[0-9]+$', ${`width=${STORED_WIDTH}`}) WHERE url LIKE '%Special:FilePath%' AND url NOT LIKE ${`%width=${STORED_WIDTH}`}`);
}

export async function resolveImages({ all = false, quiet = true } = {}) {
  const log = (...a: unknown[]) => !quiet && console.log(...a);
  await fixStoredWidths();
  const rows = await db
    .select({
      id: destinations.id,
      name: destinations.name,
      wikiTitle: destinations.wikiTitle,
      // "destinations.id" is written out in full: an unqualified "id" inside the subquery would mean images.id
      photos: sql<number>`(SELECT count(*)::int FROM images i WHERE i.owner_type = 'destination' AND i.owner_id = destinations.id)`,
    })
    .from(destinations);

  // Quick connectivity check so offline runs fail fast with one clear message
  await getJson("https://en.wikipedia.org/api/rest_v1/page/summary/Africa");

  let added = 0;
  let skipped = 0;
  for (const d of rows) {
    if (!d.wikiTitle || (!all && d.photos >= 4)) continue;
    try {
      const files = (await articlePhotos(d.wikiTitle)).slice(0, MAX_PHOTOS * 2);
      const credits = await commonsCredits(files);
      const keep = files.filter((f) => credits.has(f.replace(/ /g, "_"))).slice(0, MAX_PHOTOS);
      for (const [i, file] of keep.entries()) {
        const c = credits.get(file.replace(/ /g, "_"))!;
        const img = commonsImage(file, d.name);
        await db
          .insert(images)
          .values({ ownerType: "destination", ownerId: d.id, position: d.photos + i + 1, ...img, ...c })
          .onConflictDoUpdate({ target: [images.ownerType, images.ownerId, images.url], set: c });
        added++;
      }
      log(`  ${d.name}: ${keep.length} photo(s)`);
    } catch (err) {
      skipped++;
      log(`  ${d.name}: skipped (${(err as Error).message})`);
    }
  }

  // Fill in credits for hand-picked photos that don't have a licence yet
  const uncredited = await db
    .select({ id: images.id, url: images.url })
    .from(images)
    .where(and(eq(images.ownerType, "destination"), isNull(images.license)));
  const byFile = new Map(uncredited.map((u) => [decodeURIComponent(u.url.split("/Special:FilePath/")[1]?.split("?")[0] ?? ""), u.id]));
  const names = [...byFile.keys()].filter(Boolean);
  for (let i = 0; i < names.length; i += 50) {
    const credits = await commonsCredits(names.slice(i, i + 50));
    for (const [file, c] of credits) {
      const id = byFile.get(file);
      if (id) await db.update(images).set(c).where(eq(images.id, id));
    }
  }

  log(`Photos: ${added} added or updated${skipped ? `, ${skipped} destination(s) skipped. Run the command again to retry them` : ""}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  resolveImages({ all: process.argv.includes("--all"), quiet: false })
    .catch((err) => {
      console.error("Photo download failed:", err.message);
      process.exitCode = 1;
    })
    .finally(() => sqlClient.end());
}
