import { Router } from "express";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { affiliateClicks, businesses } from "../db/schema.js";
import { env } from "../config/env.js";
import { notFound } from "../lib/http-error.js";
import { clientIp, parse, slugParam } from "../lib/validation.js";

export const affiliateRouter = Router();

const goQuery = z.object({
  src: z.string().regex(/^[a-z0-9_-]{1,40}$/).optional(),
});

// GET /go/:slug?src=attraction
// Logs the click (for affiliate revenue reporting), then sends the visitor to the booking partner.
affiliateRouter.get("/go/:slug", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const { src } = parse(goQuery, req.query);

  const [biz] = await db
    .select({ id: businesses.id, affiliateUrl: businesses.affiliateUrl, website: businesses.website })
    .from(businesses)
    .where(and(eq(businesses.slug, slug), eq(businesses.status, "published")));

  const target = biz?.affiliateUrl || biz?.website;
  if (!biz || !target) throw notFound("Booking link");

  const ipHash = createHash("sha256").update(env.IP_HASH_SALT + clientIp(req)).digest("hex");

  // Don't make the visitor wait if logging fails
  db.insert(affiliateClicks)
    .values({
      businessId: biz.id,
      sourcePage: src ?? null,
      ipHash,
      userAgent: req.get("user-agent")?.slice(0, 500) ?? null,
    })
    .catch((err) => console.error("Failed to log affiliate click", err));

  res.redirect(302, target);
});
