import { afterEach, describe, expect, it, vi } from "vitest";

const listen = vi.hoisted(() => vi.fn((_: number, cb?: () => void) => {
  cb?.();
}));

vi.mock("http", () => ({
  createServer: vi.fn(() => ({
    listen,
  })),
}));

vi.mock("./infrastructure/database/connectDatabase.js", () => ({
  connectDatabase: vi.fn().mockResolvedValue(undefined),
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

describe("main", () => {
  const originalPort = process.env.PORT;
  const originalWrite = process.stdout.write.bind(process.stdout);

  afterEach(() => {
    process.env.PORT = originalPort;
    process.stdout.write = originalWrite;
    vi.resetModules();
  });

  it("bootstraps server and logs port", async () => {
    process.env.PORT = "34567";
    const chunks: string[] = [];
    process.stdout.write = ((msg: string | Uint8Array) => {
      chunks.push(String(msg));
      return true;
    }) as typeof process.stdout.write;

    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await import("./main.js");

    await vi.waitFor(() => {
      expect(listen).toHaveBeenCalled();
    });
    expect(chunks.join("")).toContain("34567");
    expect(exit).not.toHaveBeenCalled();
    exit.mockRestore();
  });
});
