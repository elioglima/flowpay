export function mapTicket(t: Record<string, unknown>) {
  const agent = t.agentId as { _id: unknown; name?: string } | null | undefined;
  return {
    id: String(t._id),
    subject: t.subject as string,
    team: t.team as string,
    status: t.status as string,
    agentId: agent ? String(agent._id) : undefined,
    agentName: agent?.name,
    createdAt: (t.createdAt as Date)?.toISOString?.() ?? null,
    updatedAt: (t.updatedAt as Date)?.toISOString?.() ?? null,
    activeAt: t.activeAt
      ? (t.activeAt as Date)?.toISOString?.() ?? null
      : null,
    closedAt: t.closedAt
      ? (t.closedAt as Date)?.toISOString?.() ?? null
      : undefined,
  };
}
