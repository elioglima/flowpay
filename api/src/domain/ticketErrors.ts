export class TicketNotFoundError extends Error {
  constructor() {
    super("ticket not found");
    this.name = "TicketNotFoundError";
  }
}

export class TicketInvalidStateError extends Error {
  constructor() {
    super("ticket cannot be completed");
    this.name = "TicketInvalidStateError";
  }
}
