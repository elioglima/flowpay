import cors from "cors";
import express from "express";
import { errorMiddleware } from "./presentation/http/errorMiddleware.js";
import { registerRoutes } from "./presentation/http/registerRoutes.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  registerRoutes(app);
  app.use(errorMiddleware);
  return app;
}
