import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { sqlClient } from "./db/client.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Close DB connections cleanly when the host stops the process
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(async () => {
      await sqlClient.end({ timeout: 5 });
      process.exit(0);
    });
  });
}
