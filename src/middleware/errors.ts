import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { env } from "../config/env.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "BAD_JSON", message: "Request body is not valid JSON" } });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: env.NODE_ENV === "production" ? "Something went wrong" : String(err?.message ?? err),
    },
  });
};
