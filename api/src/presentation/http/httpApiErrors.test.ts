import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDashboardSnapshot = vi.hoisted(() => vi.fn());
const createTicket = vi.hoisted(() => vi.fn());
const listClosedTickets = vi.hoisted(() => vi.fn());
const resetSimulationState = vi.hoisted(() => vi.fn());
const completeTicket = vi.hoisted(() => vi.fn());

vi.mock("../../application/distributionService.js", async () => {
  const errors = await import("../../domain/ticketErrors.js");
  return {
    getDashboardSnapshot,
    createTicket,
    listClosedTickets,
    resetSimulationState,
    completeTicket,
    TicketNotFoundError: errors.TicketNotFoundError,
    TicketInvalidStateError: errors.TicketInvalidStateError,
  };
});

describe("http routes error propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardSnapshot.mockRejectedValue(new Error("db"));
    createTicket.mockRejectedValue(new Error("db"));
    listClosedTickets.mockRejectedValue(new Error("db"));
    resetSimulationState.mockRejectedValue(new Error("db"));
    completeTicket.mockRejectedValue(new Error("db"));
  });

  it("forwards errors to error middleware", async () => {
    const { createApp } = await import("../../createApp.js");
    const app = createApp();

    await request(app).get("/api/dashboard").expect(500).expect({ error: "db" });

    await request(app)
      .post("/api/tickets")
      .send({ subject: "ok" })
      .expect(500)
      .expect({ error: "db" });

    await request(app).get("/api/tickets/closed").expect(500).expect({ error: "db" });

    await request(app).post("/api/tickets/reset").expect(500).expect({ error: "db" });

    await request(app).post("/api/tickets/507f1f77bcf86cd799439011/complete").expect(500).expect({
      error: "db",
    });
  });
});
