import { Router } from "express";
import rateLimit from "express-rate-limit";
import { catalogRouter } from "./catalog.routes.js";
import { destinationsRouter } from "./destinations.routes.js";
import { searchRouter } from "./search.routes.js";
import { placesRouter } from "./places.routes.js";
import { accountRouter } from "./account.routes.js";

export const apiV1 = Router();

// Outbound booking clicks are rate-limited so bots can't inflate affiliate stats
apiV1.use("/go", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }));

apiV1.use(catalogRouter);
apiV1.use(searchRouter); // before destinations so /search isn't shadowed
apiV1.use(destinationsRouter);
apiV1.use(placesRouter);
apiV1.use(accountRouter);
