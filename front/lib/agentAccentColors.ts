import type { DashboardAgent } from "./dashboardTypes";

export const AGENT_ACCENT_COLORS = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#a855f7",
] as const;

export function getAgentAccentColor(
  agentId: string | undefined,
  agents: DashboardAgent[]
): string | undefined {
  if (!agentId || !agents.length) {
    return undefined;
  }
  const idx = agents.findIndex((a) => a.id === agentId);
  if (idx < 0) {
    return undefined;
  }
  return AGENT_ACCENT_COLORS[idx % AGENT_ACCENT_COLORS.length];
}
