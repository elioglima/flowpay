import type { Express } from "express";
import { dashboardRouter } from "./routes/dashboardRouter.js";
import { healthRouter } from "./routes/healthRouter.js";
import { streamRouter } from "./routes/streamRouter.js";
import { ticketRouter } from "./routes/ticketRouter.js";

export function registerRoutes(app: Express) {
  app.use("/health", healthRouter);
  app.use("/api/tickets", ticketRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/stream", streamRouter);
}
