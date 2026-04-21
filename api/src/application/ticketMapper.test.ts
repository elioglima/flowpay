import { describe, expect, it } from "vitest";
import { mapTicket } from "./ticketMapper.js";

describe("mapTicket", () => {
  const baseDate = new Date("2026-04-20T12:00:00.000Z");

  it("maps lean ticket without agent", () => {
    const out = mapTicket({
      _id: "507f1f77bcf86cd799439011",
      subject: "X",
      team: "other",
      status: "queued",
      createdAt: baseDate,
      updatedAt: baseDate,
    });
    expect(out).toMatchObject({
      id: "507f1f77bcf86cd799439011",
      subject: "X",
      team: "other",
      status: "queued",
      agentId: undefined,
      agentName: undefined,
      createdAt: baseDate.toISOString(),
      updatedAt: baseDate.toISOString(),
      activeAt: null,
      closedAt: undefined,
    });
  });

  it("maps populated agentId", () => {
    const out = mapTicket({
      _id: "507f1f77bcf86cd799439011",
      subject: "Y",
      team: "cards",
      status: "active",
      agentId: { _id: "507f191e810c19729de860ea", name: "Atendente 1" },
      createdAt: baseDate,
      updatedAt: baseDate,
      activeAt: baseDate,
    });
    expect(out.agentId).toBe("507f191e810c19729de860ea");
    expect(out.agentName).toBe("Atendente 1");
    expect(out.activeAt).toBe(baseDate.toISOString());
  });

  it("maps closedAt when present", () => {
    const closed = new Date("2026-04-20T13:00:00.000Z");
    const out = mapTicket({
      _id: "507f1f77bcf86cd799439011",
      subject: "Z",
      team: "loans",
      status: "closed",
      createdAt: baseDate,
      updatedAt: baseDate,
      closedAt: closed,
    });
    expect(out.closedAt).toBe(closed.toISOString());
  });

  it("maps date fields to null when toISOString is missing", () => {
    const plain = { toISOString: undefined as undefined };
    const out = mapTicket({
      _id: "507f1f77bcf86cd799439011",
      subject: "D",
      team: "other",
      status: "queued",
      createdAt: plain,
      updatedAt: plain,
      activeAt: plain,
      closedAt: plain,
    });
    expect(out.createdAt).toBeNull();
    expect(out.updatedAt).toBeNull();
    expect(out.activeAt).toBeNull();
    expect(out.closedAt).toBeNull();
  });
});
