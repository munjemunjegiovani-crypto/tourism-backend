import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

/** Recalculate each destination's rating and review count from its reviews. */
export async function refreshRatings(destinationIds?: number[]) {
  await db.execute(sql`
    UPDATE destinations d
    SET rating = sub.avg, review_count = sub.n
    FROM (
      SELECT d2.id, ROUND(AVG(r.rating)::numeric, 1) AS avg, COUNT(r.id)::int AS n
      FROM destinations d2 LEFT JOIN reviews r ON r.destination_id = d2.id
      ${destinationIds?.length ? sql`WHERE d2.id IN (${sql.join(destinationIds.map((id) => sql`${id}`), sql`, `)})` : sql``}
      GROUP BY d2.id
    ) sub
    WHERE d.id = sub.id
  `);
}
