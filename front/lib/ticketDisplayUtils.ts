import type { DashboardTicket } from "./dashboardTypes";

export function getActiveServiceStartMs(t: DashboardTicket) {
  if (t.status !== "active") {
    return 0;
  }
  const raw = t.activeAt ?? t.createdAt;
  return raw ? new Date(raw).getTime() : 0;
}

export function ticketCreatedAtMs(t: DashboardTicket) {
  return t.createdAt ? new Date(t.createdAt).getTime() : 0;
}

function ticketSortMsForOpen(t: DashboardTicket) {
  if (t.status === "active") {
    return getActiveServiceStartMs(t) || ticketCreatedAtMs(t);
  }
  return ticketCreatedAtMs(t);
}

export function sortOpenTicketsForDisplay(tickets: DashboardTicket[]) {
  const active = tickets
    .filter((x) => x.status === "active")
    .sort((a, b) => ticketSortMsForOpen(a) - ticketSortMsForOpen(b));
  const rest = tickets
    .filter((x) => x.status !== "active")
    .sort((a, b) => ticketCreatedAtMs(a) - ticketCreatedAtMs(b));
  return [...active, ...rest];
}

export function formatTicketDateTime(iso: string | null) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}
