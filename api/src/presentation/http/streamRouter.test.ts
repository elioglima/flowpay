import type { IRouter, NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Team } from "../../domain/team.js";

const getDashboardSnapshot = vi.hoisted(() => vi.fn());

vi.mock("../../application/distributionService.js", () => ({
  getDashboardSnapshot,
}));

vi.mock("../../infrastructure/sse/sseHub.js", () => ({
  subscribeSseClient: vi.fn(),
}));

function getStreamGetHandler(router: IRouter) {
  const layer = router.stack.find((l) => l.route?.path === "/");
  const handle = layer?.route?.stack[0]?.handle;
  if (!handle) {
    throw new Error("stream GET handler not found");
  }
  return handle as (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

describe("streamRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("calls next when getDashboardSnapshot fails", async () => {
    getDashboardSnapshot.mockRejectedValue(new Error("snap"));
    const { streamRouter } = await import("./routes/streamRouter.js");
    const handler = getStreamGetHandler(streamRouter);
    const req = { on: vi.fn() } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      write: vi.fn(),
      flushHeaders: vi.fn(),
    };
    const next = vi.fn();
    await handler(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect((next.mock.calls[0][0] as Error).message).toBe("snap");
  });

  it("skips flushHeaders when res.flushHeaders is not a function", async () => {
    const { streamRouter } = await import("./routes/streamRouter.js");
    const handler = getStreamGetHandler(streamRouter);
    const req = { on: vi.fn() } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      write: vi.fn(),
      flushHeaders: undefined,
    };
    const next = vi.fn();
    await handler(req, res as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(getDashboardSnapshot).toHaveBeenCalled();
  });
});
