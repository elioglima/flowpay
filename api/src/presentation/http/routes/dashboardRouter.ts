import { Router } from "express";
import { getDashboardSnapshot } from "../../../application/distributionService.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res, next) => {
  try {
    const snapshot = await getDashboardSnapshot();
    res.status(200).json(snapshot);
  } catch (err) {
    next(err);
  }
});
