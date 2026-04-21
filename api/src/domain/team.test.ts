import { describe, expect, it } from "vitest";
import { MAX_CONCURRENT_PER_AGENT, Team } from "./team.js";

describe("team", () => {
  it("exposes capacity limit of 3 concurrent tickets per agent", () => {
    expect(MAX_CONCURRENT_PER_AGENT).toBe(3);
  });

  it("uses stable team string values", () => {
    expect(Team.Cards).toBe("cards");
    expect(Team.Loans).toBe("loans");
    expect(Team.Other).toBe("other");
  });
});
