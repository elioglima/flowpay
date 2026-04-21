import mongoose from "mongoose";
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const database =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({ status: "ok", database });
});
