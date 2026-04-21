import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("http", () => ({
  createServer: vi.fn(() => ({
    listen: vi.fn(),
  })),
}));

vi.mock("./infrastructure/database/connectDatabase.js", () => ({
  connectDatabase: vi.fn().mockRejectedValue(new Error("db down")),
}));

vi.mock("./bootstrap/seedAgents.js", () => ({
  seedAgentsIfEmpty: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./createApp.js", async () => {
  const express = (await import("express")).default;
  return {
    createApp: vi.fn(() => express()),
  };
});

vi.mock("dotenv", () => ({
  config: vi.fn(),
}));

describe("main bootstrap failure", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("writes to stderr and exits when connectDatabase fails", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await import("./main.js");

    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(1);
    });
    expect(stderr.mock.calls.map((c) => String(c[0])).join("")).toContain("db down");

    stderr.mockRestore();
    exit.mockRestore();
  });
});
