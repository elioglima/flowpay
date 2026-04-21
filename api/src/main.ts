import { config } from "dotenv";
import { createServer } from "http";
import { createApp } from "./createApp.js";
import { seedAgentsIfEmpty } from "./bootstrap/seedAgents.js";
import { connectDatabase } from "./infrastructure/database/connectDatabase.js";

config();

const port = Number(process.env.PORT ?? 3001);

async function bootstrap() {
  await connectDatabase();
  await seedAgentsIfEmpty();
  const app = createApp();
  const server = createServer(app);
  server.listen(port, () => {
    process.stdout.write(`api listening on ${port}\n`);
  });
}

bootstrap().catch((err) => {
  process.stderr.write(`${err}\n`);
  process.exit(1);
});
