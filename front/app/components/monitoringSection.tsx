import type { DashboardSnapshot } from "../../lib/dashboardTypes";
import { DashboardCharts } from "../dashboardCharts";

type MonitoringSectionProps = {
  snapshot: DashboardSnapshot | null;
};

export default function MonitoringSection({ snapshot }: MonitoringSectionProps) {
  return (
    <section className="pageBlock">
      <div className="sectionHead">
        <p className="sectionKicker">Monitoramento</p>
        <h2 className="sectionTitle">Visão geral</h2>
        <p className="sectionDesc muted">
          Gráficos atualizados em tempo real com os mesmos dados do painel (SSE).
        </p>
      </div>
      <DashboardCharts snapshot={snapshot} />
    </section>
  );
}
