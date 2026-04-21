import { afterEach, describe, expect, it, vi } from "vitest";

const connect = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("mongoose", () => ({
  default: {
    connect,
  },
}));

describe("connectDatabase", () => {
  const originalUri = process.env.MONGODB_URI;

  afterEach(() => {
    process.env.MONGODB_URI = originalUri;
    vi.clearAllMocks();
  });

  it("throws when MONGODB_URI is missing", async () => {
    delete process.env.MONGODB_URI;
    const { connectDatabase } = await import("./connectDatabase.js");
    await expect(connectDatabase()).rejects.toThrow("MONGODB_URI is required");
    expect(connect).not.toHaveBeenCalled();
  });

  it("calls mongoose.connect with uri", async () => {
    process.env.MONGODB_URI = "mongodb://test:27017/x";
    const { connectDatabase } = await import("./connectDatabase.js");
    await connectDatabase();
    expect(connect).toHaveBeenCalledWith("mongodb://test:27017/x");
  });
});
