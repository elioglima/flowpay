import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Team } from "../domain/team.js";
import {
  TicketInvalidStateError,
  TicketNotFoundError,
} from "../domain/ticketErrors.js";

const broadcastSse = vi.hoisted(() => vi.fn());

vi.mock("../infrastructure/sse/sseHub.js", () => ({
  broadcastSse,
}));

const agentFindExec = vi.hoisted(() => vi.fn());
const agentFindOneAndUpdateExec = vi.hoisted(() => vi.fn());
const agentFindByIdAndUpdateExec = vi.hoisted(() => vi.fn());
const agentUpdateManyExec = vi.hoisted(() => vi.fn());

const ticketExistsExec = vi.hoisted(() => vi.fn());
const ticketFindOneAndUpdateExec = vi.hoisted(() => vi.fn());
const ticketFindExec = vi.hoisted(() => vi.fn());
const ticketCountExec = vi.hoisted(() => vi.fn());
const ticketDeleteManyExec = vi.hoisted(() => vi.fn());
const ticketCreate = vi.hoisted(() => vi.fn());
const ticketFindByIdExec = vi.hoisted(() => vi.fn());
const ticketFindOneExec = vi.hoisted(() => vi.fn());
const ticketFindByIdSimpleExec = vi.hoisted(() => vi.fn());

vi.mock("../models/agentModel.js", () => ({
  AgentModel: {
    find: () => ({
      sort: () => ({
        lean: () => ({
          exec: agentFindExec,
        }),
      }),
    }),
    findOneAndUpdate: () => ({
      exec: agentFindOneAndUpdateExec,
    }),
    findByIdAndUpdate: () => ({
      exec: agentFindByIdAndUpdateExec,
    }),
    updateMany: () => ({
      exec: agentUpdateManyExec,
    }),
  },
}));

const ticketFindChain = vi.hoisted(() => {
  const chain: {
    sort: ReturnType<typeof vi.fn>;
    skip: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    populate: ReturnType<typeof vi.fn>;
    lean: ReturnType<typeof vi.fn>;
  } = {
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    populate: vi.fn(),
    lean: vi.fn(),
  };
  chain.sort.mockImplementation(() => chain);
  chain.skip.mockImplementation(() => chain);
  chain.limit.mockImplementation(() => chain);
  chain.populate.mockImplementation(() => chain);
  chain.lean.mockImplementation(() => ({
    exec: ticketFindExec,
  }));
  return chain;
});

vi.mock("../models/ticketModel.js", () => ({
  TicketModel: {
    exists: () => ({
      exec: ticketExistsExec,
    }),
    findOneAndUpdate: () => ({
      exec: ticketFindOneAndUpdateExec,
    }),
    find: () => ticketFindChain,
    countDocuments: () => ({
      exec: ticketCountExec,
    }),
    deleteMany: () => ({
      exec: ticketDeleteManyExec,
    }),
    create: (...args: unknown[]) => ticketCreate(...args),
    findById: () => ({
      populate: () => ({
        lean: () => ({
          exec: ticketFindByIdExec,
        }),
      }),
      exec: ticketFindByIdSimpleExec,
    }),
    findOne: () => ({
      exec: ticketFindOneExec,
    }),
  },
}));

describe("distributionService", () => {
  beforeEach(() => {
    broadcastSse.mockClear();
    agentFindExec.mockReset();
    agentFindExec.mockResolvedValue([]);
    agentFindOneAndUpdateExec.mockReset();
    agentFindOneAndUpdateExec.mockResolvedValue(null);
    agentFindByIdAndUpdateExec.mockResolvedValue(undefined);
    agentUpdateManyExec.mockResolvedValue(undefined);
    ticketExistsExec.mockResolvedValue(null);
    ticketFindOneAndUpdateExec.mockResolvedValue(null);
    ticketFindExec.mockResolvedValue([]);
    ticketCountExec.mockResolvedValue(0);
    ticketDeleteManyExec.mockResolvedValue({});
    ticketCreate.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    ticketFindByIdExec.mockResolvedValue(null);
    ticketFindOneExec.mockResolvedValue(null);
    ticketFindByIdSimpleExec.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getDashboardSnapshot maps agents and counts", async () => {
    agentFindExec.mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        name: "A",
        team: Team.Cards,
        activeAssignments: 1,
      },
    ]);
    ticketFindExec.mockResolvedValue([]);
    ticketCountExec.mockResolvedValue(2);
    const { getDashboardSnapshot } = await import("./distributionService.js");
    const snap = await getDashboardSnapshot();
    expect(snap.agents).toHaveLength(1);
    expect(snap.agents[0].capacity).toBe(3);
    expect(snap.queueLengths[Team.Cards]).toBe(2);
    expect(snap.closedByTeam[Team.Loans]).toBe(2);
    expect(snap.openTickets).toEqual([]);
  });

  it("listClosedTickets applies search filter when q is non-empty", async () => {
    const id = new mongoose.Types.ObjectId();
    ticketFindExec.mockResolvedValue([
      {
        _id: id,
        subject: "foo",
        team: Team.Other,
        status: "closed",
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: new Date(),
      },
    ]);
    ticketCountExec.mockResolvedValue(1);
    const { listClosedTickets } = await import("./distributionService.js");
    const out = await listClosedTickets({ page: 1, pageSize: 10, q: " foo " });
    expect(out.total).toBe(1);
    expect(out.items[0].subject).toBe("foo");
  });

  it("listClosedTickets without q uses status closed only", async () => {
    ticketFindExec.mockResolvedValue([]);
    ticketCountExec.mockResolvedValue(0);
    const { listClosedTickets } = await import("./distributionService.js");
    const out = await listClosedTickets({ page: 2, pageSize: 5 });
    expect(out.page).toBe(2);
    expect(out.items).toEqual([]);
  });

  it("resetSimulationState clears tickets and resets agents", async () => {
    const { resetSimulationState } = await import("./distributionService.js");
    await resetSimulationState();
    expect(ticketDeleteManyExec).toHaveBeenCalled();
    expect(agentUpdateManyExec).toHaveBeenCalled();
    expect(broadcastSse).toHaveBeenCalled();
  });

  it("createTicket assigns agent when capacity available", async () => {
    const agentId = new mongoose.Types.ObjectId();
    agentFindOneAndUpdateExec.mockResolvedValue({
      _id: agentId,
      activeAssignments: 1,
    });
    const createdId = new mongoose.Types.ObjectId();
    ticketCreate.mockResolvedValue({ _id: createdId });
    ticketFindByIdExec.mockResolvedValue({
      _id: createdId,
      subject: "s",
      team: Team.Cards,
      status: "active",
      agentId: { _id: agentId, name: "N" },
      createdAt: new Date(),
      updatedAt: new Date(),
      activeAt: new Date(),
    });
    const { createTicket } = await import("./distributionService.js");
    const t = await createTicket("cartão");
    expect(t.status).toBe("active");
    expect(broadcastSse).toHaveBeenCalled();
  });

  it("createTicket queues when no agent available", async () => {
    agentFindOneAndUpdateExec.mockResolvedValue(null);
    const createdId = new mongoose.Types.ObjectId();
    ticketCreate.mockResolvedValue({ _id: createdId });
    ticketFindByIdExec.mockResolvedValue({
      _id: createdId,
      subject: "x",
      team: Team.Other,
      status: "queued",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { createTicket } = await import("./distributionService.js");
    const t = await createTicket("outro");
    expect(t.status).toBe("queued");
  });

  it("createTicket rolls back agent when create fails", async () => {
    const agentId = new mongoose.Types.ObjectId();
    agentFindOneAndUpdateExec.mockResolvedValue({
      _id: agentId,
      activeAssignments: 1,
    });
    ticketCreate.mockRejectedValue(new Error("db"));
    const { createTicket } = await import("./distributionService.js");
    await expect(createTicket("cartão")).rejects.toThrow("db");
    expect(agentFindByIdAndUpdateExec).toHaveBeenCalled();
  });

  it("createTicket throws when ticket cannot be reloaded", async () => {
    const agentId = new mongoose.Types.ObjectId();
    agentFindOneAndUpdateExec.mockResolvedValue({
      _id: agentId,
      activeAssignments: 1,
    });
    const createdId = new mongoose.Types.ObjectId();
    ticketCreate.mockResolvedValue({ _id: createdId });
    ticketFindByIdExec.mockResolvedValue(null);
    const { createTicket } = await import("./distributionService.js");
    await expect(createTicket("cartão")).rejects.toThrow("ticket persist failed");
  });

  it("completeTicket throws for invalid id", async () => {
    const { completeTicket } = await import("./distributionService.js");
    await expect(completeTicket("bad")).rejects.toBeInstanceOf(TicketNotFoundError);
  });

  it("completeTicket throws when ticket missing", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    ticketFindOneExec.mockResolvedValue(null);
    ticketFindByIdSimpleExec.mockResolvedValue(null);
    const { completeTicket } = await import("./distributionService.js");
    await expect(completeTicket(id)).rejects.toBeInstanceOf(TicketNotFoundError);
  });

  it("completeTicket throws invalid state when ticket not active", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    ticketFindOneExec.mockResolvedValue(null);
    ticketFindByIdSimpleExec.mockResolvedValue({ _id: id, status: "closed" });
    const { completeTicket } = await import("./distributionService.js");
    await expect(completeTicket(id)).rejects.toBeInstanceOf(TicketInvalidStateError);
  });

  it("completeTicket throws when agentId missing", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    ticketFindOneExec.mockResolvedValue({
      _id: id,
      status: "active",
      team: Team.Cards,
      agentId: null,
      save: vi.fn(),
    });
    const { completeTicket } = await import("./distributionService.js");
    await expect(completeTicket(id)).rejects.toBeInstanceOf(TicketInvalidStateError);
  });

  it("completeTicket throws when decrement fails", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const agentId = new mongoose.Types.ObjectId();
    ticketFindOneExec.mockResolvedValue({
      _id: id,
      status: "active",
      team: Team.Cards,
      agentId,
      save: vi.fn(),
    });
    agentFindOneAndUpdateExec.mockResolvedValueOnce(null);
    const { completeTicket } = await import("./distributionService.js");
    await expect(completeTicket(id)).rejects.toBeInstanceOf(TicketInvalidStateError);
  });

  it("completeTicket rolls back agent increment when save fails", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const agentId = new mongoose.Types.ObjectId();
    const save = vi.fn().mockRejectedValue(new Error("save"));
    ticketFindOneExec.mockResolvedValue({
      _id: id,
      status: "active",
      team: Team.Cards,
      agentId,
      save,
    });
    agentFindOneAndUpdateExec.mockResolvedValue({ _id: agentId });
    const { completeTicket } = await import("./distributionService.js");
    await expect(completeTicket(id)).rejects.toThrow("save");
    expect(agentFindByIdAndUpdateExec).toHaveBeenCalled();
  });

  it("completeTicket runs assignNextFromQueue and restores agent when queue update misses", async () => {
    vi.useFakeTimers();
    const id = new mongoose.Types.ObjectId().toString();
    const agentId = new mongoose.Types.ObjectId();
    const save = vi.fn().mockResolvedValue(undefined);
    ticketFindOneExec.mockResolvedValue({
      _id: id,
      status: "active",
      team: Team.Cards,
      agentId,
      save,
    });
    agentFindOneAndUpdateExec
      .mockResolvedValueOnce({ _id: agentId })
      .mockResolvedValueOnce({ _id: agentId })
      .mockResolvedValueOnce(null);
    ticketExistsExec.mockResolvedValue({ _id: "q" });
    ticketFindOneAndUpdateExec.mockResolvedValue(null);
    const { completeTicket } = await import("./distributionService.js");
    const p = completeTicket(id);
    await vi.advanceTimersByTimeAsync(700);
    await p;
    expect(save).toHaveBeenCalled();
    expect(agentFindByIdAndUpdateExec).toHaveBeenCalled();
    expect(broadcastSse).toHaveBeenCalled();
  });

  it("completeTicket assignNextFromQueue returns when no agent available for queue", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const agentId = new mongoose.Types.ObjectId();
    const save = vi.fn().mockResolvedValue(undefined);
    ticketFindOneExec.mockResolvedValue({
      _id: id,
      status: "active",
      team: Team.Other,
      agentId,
      save,
    });
    agentFindOneAndUpdateExec
      .mockResolvedValueOnce({ _id: agentId, activeAssignments: 1 })
      .mockResolvedValueOnce(null);
    ticketExistsExec.mockResolvedValue({ _id: "q" });
    const { completeTicket } = await import("./distributionService.js");
    await completeTicket(id);
    expect(broadcastSse).toHaveBeenCalled();
  });

  it("completeTicket assigns next ticket when queue has items", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const agentId = new mongoose.Types.ObjectId();
    const save = vi.fn().mockResolvedValue(undefined);
    ticketFindOneExec.mockResolvedValue({
      _id: id,
      status: "active",
      team: Team.Loans,
      agentId,
      save,
    });
    agentFindOneAndUpdateExec.mockResolvedValue({
      _id: agentId,
      activeAssignments: 1,
    });
    ticketExistsExec.mockResolvedValue({ _id: "q" });
    ticketFindOneAndUpdateExec.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    const { completeTicket } = await import("./distributionService.js");
    await completeTicket(id);
    expect(ticketFindOneAndUpdateExec).toHaveBeenCalled();
  });
});
