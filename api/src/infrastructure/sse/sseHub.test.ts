import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { broadcastSse, subscribeSseClient, unsubscribeSseClient } from "./sseHub.js";

describe("sseHub", () => {
  it("broadcasts json payload to subscribed clients", () => {
    const write = vi.fn();
    const res = { write } as unknown as Response;
    subscribeSseClient(res);
    broadcastSse({ type: "ping" });
    expect(write).toHaveBeenCalledWith('data: {"type":"ping"}\n\n');
    unsubscribeSseClient(res);
    write.mockClear();
    broadcastSse({ type: "x" });
    expect(write).not.toHaveBeenCalled();
  });
});
