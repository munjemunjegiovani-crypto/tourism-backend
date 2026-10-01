import { z } from "zod";
import type { Request } from "express";
import { badRequest } from "./http-error.js";

/** Parse req.query (or params) with a Zod schema; throws a 400 with readable messages. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
      .join("; ");
    throw badRequest(message);
  }
  return result.data;
}

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.coerce.number().int().positive().optional(),
});

export const slugParam = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "must contain only lowercase letters, numbers and dashes"),
});

/** Keyset pagination helper: returns the page and the cursor for the next one. */
export function page<T extends { id: number }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}

export const clientIp = (req: Request) => req.ip ?? req.socket.remoteAddress ?? "";
