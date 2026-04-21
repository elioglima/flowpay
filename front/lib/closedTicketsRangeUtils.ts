import type { ClosedTicketsPage } from "./dashboardTypes";

export function getClosedTicketsDisplayRange(data: ClosedTicketsPage) {
  const total = data.total;
  const from = total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / data.pageSize));
  return { from, to, totalPages };
}
