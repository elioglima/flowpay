import { afterEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  models: {} as Record<string, unknown>,
}));

vi.mock("mongoose", () => {
  class Schema {
    static Types = {
      ObjectId: class ObjectId {},
    };
    index = vi.fn().mockReturnThis();
  }
  const model = vi.fn((name: string) => {
    if (store.models[name]) {
      return store.models[name];
    }
    const inst = { modelName: name };
    store.models[name] = inst;
    return inst;
  });
  return {
    default: {
      Schema,
      model,
      get models() {
        return store.models;
      },
    },
  };
});

describe("mongoose models", () => {
  afterEach(() => {
    vi.resetModules();
    store.models = {};
  });

  it("registers Agent model", async () => {
    const { AgentModel } = await import("./agentModel.js");
    expect(AgentModel).toBe(store.models.Agent);
  });

  it("reuses Agent model when mongoose already registered it", async () => {
    store.models.Agent = { fromCache: true };
    const { AgentModel } = await import("./agentModel.js");
    expect(AgentModel).toEqual({ fromCache: true });
  });

  it("registers Ticket model", async () => {
    const { TicketModel } = await import("./ticketModel.js");
    expect(TicketModel).toBe(store.models.Ticket);
  });

  it("reuses Ticket model when mongoose already registered it", async () => {
    store.models.Ticket = { fromCache: true };
    const { TicketModel } = await import("./ticketModel.js");
    expect(TicketModel).toEqual({ fromCache: true });
  });
});
