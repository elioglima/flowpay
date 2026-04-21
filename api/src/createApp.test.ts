import http from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Team } from "./domain/team.js";
import {
  TicketInvalidStateError,
  TicketNotFoundError,
} from "./domain/ticketErrors.js";

const mongooseState = vi.hoisted(() => ({ readyState: 1 }));

vi.mock("mongoose", () => ({
  default: {
    connection: {
      get readyState() {
        return mongooseState.readyState;
      },
    },
  },
}));

const getDashboardSnapshot = vi.hoisted(() => vi.fn());
const createTicket = vi.hoisted(() => vi.fn());
const listClosedTickets = vi.hoisted(() => vi.fn());
const resetSimulationState = vi.hoisted(() => vi.fn());
const completeTicket = vi.hoisted(() => vi.fn());

vi.mock("./application/distributionService.js", async () => {
  const errors = await import("./domain/ticketErrors.js");
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

describe("createApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mongooseState.readyState = 1;
    getDashboardSnapshot.mockResolvedValue({
      agents: [],
      openTickets: [],
      recentClosed: [],
      queueLengths: {
        [Team.Cards]: 0,
        [Team.Loans]: 0,
        [Team.Other]: 0,
      },
      closedByTeam: {
        [Team.Cards]: 0,
        [Team.Loans]: 0,
        [Team.Other]: 0,
      },
    });
    createTicket.mockResolvedValue({ id: "t1", subject: "s", status: "active" });
    listClosedTickets.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });
    resetSimulationState.mockResolvedValue(undefined);
    completeTicket.mockResolvedValue(undefined);
  });

  it("registers health, tickets, dashboard and stream routes", async () => {
    const { createApp } = await import("./createApp.js");
    const app = createApp();

    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok", database: "connected" });

    mongooseState.readyState = 0;
    const healthOff = await request(app).get("/health");
    expect(healthOff.body.database).toBe("disconnected");

    const dash = await request(app).get("/api/dashboard");
    expect(dash.status).toBe(200);
    expect(getDashboardSnapshot).toHaveBeenCalled();

    const created = await request(app)
      .post("/api/tickets")
      .send({ subject: "  cartão  " })
      .set("Content-Type", "application/json");
    expect(created.status).toBe(201);
    expect(createTicket).toHaveBeenCalledWith("cartão");

    const bad = await request(app).post("/api/tickets").send({ subject: 1 });
    expect(bad.status).toBe(400);

    const empty = await request(app).post("/api/tickets").send({});
    expect(empty.status).toBe(400);

    const closed = await request(app).get("/api/tickets/closed?page=2&pageSize=5&q=test");
    expect(closed.status).toBe(200);
    expect(listClosedTickets).toHaveBeenCalledWith({
      page: 2,
      pageSize: 5,
      q: "test",
    });

    const closedFallback = await request(app).get("/api/tickets/closed?page=abc&pageSize=0");
    expect(closedFallback.status).toBe(200);
    expect(listClosedTickets).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      q: undefined,
    });

    const closedCap = await request(app).get("/api/tickets/closed?page=1&pageSize=99");
    expect(closedCap.status).toBe(200);
    expect(listClosedTickets).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50,
      q: undefined,
    });

    await request(app).post("/api/tickets/reset").expect(204);

    const done = await request(app)
      .post("/api/tickets/507f1f77bcf86cd799439011/complete")
      .send();
    expect(done.status).toBe(204);

    completeTicket.mockRejectedValueOnce(new TicketNotFoundError());
    const nf = await request(app).post("/api/tickets/507f1f77bcf86cd799439011/complete");
    expect(nf.status).toBe(404);

    completeTicket.mockRejectedValueOnce(new TicketInvalidStateError());
    const inv = await request(app).post("/api/tickets/507f1f77bcf86cd799439011/complete");
    expect(inv.status).toBe(400);

    await new Promise<void>((resolve, reject) => {
      const srv = http.createServer(app);
      srv.listen(0, () => {
        const { port } = srv.address() as { port: number };
        const req = http.get(`http://127.0.0.1:${port}/api/stream`, (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
          res.once("data", (chunk) => {
            expect(String(chunk)).toContain("dashboard");
            res.destroy();
            req.destroy();
            srv.close(() => resolve());
          });
        });
        req.on("error", reject);
      });
    });
  });
});
