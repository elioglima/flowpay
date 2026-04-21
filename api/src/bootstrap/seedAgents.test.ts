import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const countExec = vi.hoisted(() => vi.fn());
const insertMany = vi.hoisted(() => vi.fn());

vi.mock("../models/agentModel.js", () => ({
  AgentModel: {
    countDocuments: () => ({ exec: countExec }),
    insertMany,
  },
}));

describe("seedAgentsIfEmpty", () => {
  beforeEach(() => {
    countExec.mockReset();
    insertMany.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns early when agents already exist", async () => {
    countExec.mockResolvedValue(3);
    const { seedAgentsIfEmpty } = await import("./seedAgents.js");
    await seedAgentsIfEmpty();
    expect(insertMany).not.toHaveBeenCalled();
  });

  it("inserts default agents when collection is empty", async () => {
    countExec.mockResolvedValue(0);
    insertMany.mockResolvedValue(undefined);
    const { seedAgentsIfEmpty } = await import("./seedAgents.js");
    await seedAgentsIfEmpty();
    expect(insertMany).toHaveBeenCalledTimes(1);
    expect(insertMany.mock.calls[0][0]).toHaveLength(6);
  });
});
