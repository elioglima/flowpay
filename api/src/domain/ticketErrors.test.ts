import { describe, expect, it } from "vitest";
import {
  TicketInvalidStateError,
  TicketNotFoundError,
} from "./ticketErrors.js";

describe("ticketErrors", () => {
  it("TicketNotFoundError has expected name and message", () => {
    const e = new TicketNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TicketNotFoundError");
    expect(e.message).toBe("ticket not found");
  });

  it("TicketInvalidStateError has expected name and message", () => {
    const e = new TicketInvalidStateError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TicketInvalidStateError");
    expect(e.message).toBe("ticket cannot be completed");
  });
});
