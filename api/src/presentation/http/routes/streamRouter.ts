import { Router } from "express";
import { getDashboardSnapshot } from "../../../application/distributionService.js";
import {
  subscribeSseClient,
  unsubscribeSseClient,
} from "../../../infrastructure/sse/sseHub.js";

export const streamRouter = Router();

streamRouter.get("/", async (req, res, next) => {
  try {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }
    subscribeSseClient(res);
    const snapshot = await getDashboardSnapshot();
    res.write(
      `data: ${JSON.stringify({ type: "dashboard", payload: snapshot })}\n\n`
    );
    req.on("close", () => {
      unsubscribeSseClient(res);
    });
  } catch (err) {
    next(err);
  }
});
