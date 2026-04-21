export type DashboardAgent = {
  id: string;
  name: string;
  team: string;
  activeAssignments: number;
  capacity: number;
};

export type DashboardTicket = {
  id: string;
  subject: string;
  team: string;
  status: string;
  agentId?: string;
  agentName?: string;
  createdAt: string | null;
  updatedAt?: string | null;
  activeAt?: string | null;
  closedAt?: string | null;
};

export type QueueLengths = Record<string, number>;

export type ClosedByTeam = Record<string, number>;

export type DashboardSnapshot = {
  agents: DashboardAgent[];
  openTickets: DashboardTicket[];
  recentClosed: DashboardTicket[];
  queueLengths: QueueLengths;
  closedByTeam: ClosedByTeam;
};

export type ClosedTicketsPage = {
  items: DashboardTicket[];
  total: number;
  page: number;
  pageSize: number;
};

export type AutoReleaseScheduleEntry = {
  deadlineMs: number;
  durationMs: number;
};
