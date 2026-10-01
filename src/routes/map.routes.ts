import { Router } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { badRequest } from "../lib/http-error.js";
import { parse } from "../lib/validation.js";

export const mapRouter = Router();

const mapQuery = z.object({
  // bbox=minLng,minLat,maxLng,maxLat (the visible map area)
  bbox: z.string(),
  types: z.string().default("attraction,business"),
});

type MapRow = {
  kind: "attraction" | "business";
  slug: string;
  name: string;
  category_slug: string;
  sponsored: boolean;
  lat: number;
  lng: number;
};

// GET /map?bbox=minLng,minLat,maxLng,maxLat&types=attraction,business
mapRouter.get("/map", async (req, res) => {
  const { bbox, types } = parse(mapQuery, req.query);
  const nums = bbox.split(",").map(Number);
  if (nums.length !== 4 || nums.some((n) => !Number.isFinite(n))) {
    throw badRequest("bbox must be minLng,minLat,maxLng,maxLat");
  }
  const [minLng, minLat, maxLng, maxLat] = nums;
  const wanted = new Set(types.split(","));
  const envelope = sql`ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;

  const parts = [];
  if (wanted.has("attraction")) {
    parts.push(sql`
      SELECT 'attraction' AS kind, a.slug, a.name, c.slug AS category_slug, FALSE AS sponsored,
             ST_Y(a.location) AS lat, ST_X(a.location) AS lng
      FROM attractions a JOIN categories c ON c.id = a.category_id
      WHERE a.status = 'published' AND a.location && ${envelope}`);
  }
  if (wanted.has("business")) {
    parts.push(sql`
      SELECT 'business' AS kind, b.slug, b.name, c.slug AS category_slug, (b.plan <> 'free') AS sponsored,
             ST_Y(b.location) AS lat, ST_X(b.location) AS lng
      FROM businesses b JOIN categories c ON c.id = b.category_id
      WHERE b.status = 'published' AND b.location && ${envelope}`);
  }
  if (parts.length === 0) throw badRequest("types must include attraction and/or business");

  const rows = await db.execute<MapRow>(sql`${sql.join(parts, sql` UNION ALL `)} LIMIT 500`);

  res.json({
    data: rows.map((r) => ({
      kind: r.kind,
      slug: r.slug,
      name: r.name,
      category: r.category_slug,
      sponsored: r.sponsored,
      location: { lat: Number(r.lat), lng: Number(r.lng) },
    })),
  });
});
