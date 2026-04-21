import { Router } from "express";
import {
  TicketInvalidStateError,
  TicketNotFoundError,
  completeTicket,
  createTicket,
  listClosedTickets,
  resetSimulationState,
} from "../../../application/distributionService.js";

export const ticketRouter = Router();

ticketRouter.post("/", async (req, res, next) => {
  try {
    const subject = req.body?.subject;
    if (typeof subject !== "string" || !subject.trim()) {
      res.status(400).json({ error: "subject is required" });
      return;
    }
    const ticket = await createTicket(subject.trim());
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

ticketRouter.get("/closed", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const rawSize = parseInt(String(req.query.pageSize ?? "10"), 10) || 10;
    const pageSize = Math.min(50, Math.max(1, rawSize));
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const result = await listClosedTickets({ page, pageSize, q });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

ticketRouter.post("/reset", async (_req, res, next) => {
  try {
    await resetSimulationState();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

ticketRouter.post("/:ticketId/complete", async (req, res, next) => {
  try {
    await completeTicket(req.params.ticketId);
    res.status(204).end();
  } catch (err) {
    if (err instanceof TicketNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err instanceof TicketInvalidStateError) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});
