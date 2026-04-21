"use client";

import type { DashboardSnapshot } from "../lib/dashboardTypes";
import { AGENT_ACCENT_COLORS } from "../lib/agentAccentColors";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const queueName: Record<string, string> = {
  cards: "Cartões",
  loans: "Empréstimos",
  other: "Outros",
};

const TEAM_BAR_COLORS = ["#2dd4bf", "#a78bfa", "#38bdf8"];

const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#f1f5f9",
};

export function DashboardCharts({
  snapshot,
}: {
  snapshot: DashboardSnapshot | null;
}) {
  if (!snapshot) {
    return (
      <div className="chartPlaceholder">
        <p className="muted">Carregando gráficos…</p>
      </div>
    );
  }

  const teamKeys = ["cards", "loans", "other"] as const;
  const queueData = teamKeys.map((key) => ({
    name: queueName[key] ?? key,
    fila: snapshot.queueLengths[key] ?? 0,
  }));

  const agentData = snapshot.agents.map((a) => ({
    name: a.name.replace(/^Atendente\s+/i, ""),
    ocupados: a.activeAssignments,
    livre: Math.max(0, a.capacity - a.activeAssignments),
  }));

  const openByTeam = snapshot.openTickets.reduce(
    (acc, t) => {
      acc[t.team] = (acc[t.team] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const teamOpenData = teamKeys.map((key) => ({
    name: queueName[key] ?? key,
    abertos: openByTeam[key] ?? 0,
  }));

  const closedByTeam = snapshot.closedByTeam ?? {};
  const teamClosedData = teamKeys.map((key) => ({
    name: queueName[key] ?? key,
    concluidos: closedByTeam[key] ?? 0,
  }));
  const closedTotal = teamKeys.reduce(
    (sum, key) => sum + (closedByTeam[key] ?? 0),
    0
  );

  return (
    <div className="chartsGrid">
      <div className="chartPanel">
        <div className="chartPanelHeader">
          <span className="chartTitle">Fila de espera por time</span>
          <span className="chartSubtitle">Solicitações aguardando atendente livre</span>
        </div>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={queueData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 13 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.15)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(45, 212, 191, 0.06)" }} />
              <Bar dataKey="fila" name="Na fila" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {queueData.map((_, i) => (
                  <Cell key={`q-${i}`} fill={TEAM_BAR_COLORS[i % TEAM_BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chartPanel">
        <div className="chartPanelHeader">
          <span className="chartTitle">Solicitações abertas por time</span>
          <span className="chartSubtitle">Ativos + em fila (snapshot atual)</span>
        </div>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamOpenData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 13 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.15)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(56, 189, 248, 0.06)" }} />
              <Bar dataKey="abertos" name="Abertos" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {teamOpenData.map((_, i) => (
                  <Cell key={`o-${i}`} fill={TEAM_BAR_COLORS[i % TEAM_BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chartPanel">
        <div className="chartPanelHeader">
          <span className="chartTitle">Concluídos por time</span>
          <span className="chartSubtitle">
            Total de atendimentos encerrados no histórico ({closedTotal} no banco)
          </span>
        </div>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={teamClosedData}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 13 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.15)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(74, 222, 128, 0.08)" }} />
              <Bar dataKey="concluidos" name="Concluídos" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {teamClosedData.map((_, i) => (
                  <Cell key={`c-${i}`} fill={TEAM_BAR_COLORS[i % TEAM_BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chartPanel chartPanelWide">
        <div className="chartPanelHeader">
          <span className="chartTitle">Ocupação por atendente</span>
          <span className="chartSubtitle">Ativos vs vagas livres (máx. 3 por pessoa)</span>
        </div>
        <div className="chartBody chartBodyTall">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={agentData}
              margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              barSize={16}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.12)" />
              <XAxis
                type="number"
                domain={[0, 3]}
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 13 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.15)" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                tick={{ fill: "#cbd5e1", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167, 139, 250, 0.06)" }} />
              <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "8px", color: "#cbd5e1" }} />
              <Bar
                dataKey="livre"
                name="Livre"
                stackId="a"
                fill="rgba(71, 85, 105, 0.45)"
                radius={[0, 4, 4, 0]}
              />
              <Bar dataKey="ocupados" name="Em atendimento" stackId="a" radius={[4, 0, 0, 4]}>
                {agentData.map((_, i) => (
                  <Cell key={`a-${i}`} fill={AGENT_ACCENT_COLORS[i % AGENT_ACCENT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
