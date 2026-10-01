import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { apiV1 } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { sqlClient } from "./db/client.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1); // behind Render/Railway's proxy: use the real client IP
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));
  app.use(
    rateLimit({ windowMs: 15 * 60_000, limit: 600, standardHeaders: "draft-8", legacyHeaders: false }),
  );

  // Health check for the hosting platform and uptime monitors
  app.get("/health", async (_req, res) => {
    try {
      await sqlClient`SELECT 1`;
      res.json({ status: "ok", database: "ok" });
    } catch {
      res.status(503).json({ status: "degraded", database: "unreachable" });
    }
  });

  app.use("/api/v1", apiV1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
