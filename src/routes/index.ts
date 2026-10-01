import { Router } from "express";
import rateLimit from "express-rate-limit";
import { placesRouter } from "./places.routes.js";
import { attractionsRouter } from "./attractions.routes.js";
import { businessesRouter } from "./businesses.routes.js";
import { affiliateRouter } from "./affiliate.routes.js";
import { mapRouter } from "./map.routes.js";

export const apiV1 = Router();

// Stricter limit on outbound clicks so bots can't inflate affiliate stats
const clickLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });

apiV1.use(placesRouter);
apiV1.use(attractionsRouter);
apiV1.use(businessesRouter);
apiV1.use(mapRouter);
apiV1.use("/go", clickLimiter);
apiV1.use(affiliateRouter);
