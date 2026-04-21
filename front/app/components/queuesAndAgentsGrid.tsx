import type { DashboardSnapshot } from "../../lib/dashboardTypes";
import { teamLabel } from "../../lib/dashboardConstants";
import { getAgentAccentColor } from "../../lib/agentAccentColors";
import { AgentUserIcon } from "../../lib/agentUserIcon";
import { QueueTeamIcon } from "../../lib/queueTeamIcons";

type QueuesAndAgentsGridProps = {
  snapshot: DashboardSnapshot | null;
};

export default function QueuesAndAgentsGrid({ snapshot }: QueuesAndAgentsGridProps) {
  return (
    <section className="pageBlock">
      <div className="sectionHead sectionHeadTight">
        <p className="sectionKicker">Detalhes</p>
        <h2 className="sectionTitle">Filas e atendentes</h2>
      </div>
      <div className="gridTwo listsGrid">
        <section className="panel">
          <div className="panelHeader">
            <span className="dot dotMuted" />
            <span>Filas por time</span>
          </div>
          {!snapshot ? (
            <p className="muted">Carregando…</p>
          ) : (
            <ul className="queueList">
              {Object.entries(snapshot.queueLengths).map(([team, len]) => (
                <li key={team} className="queueItem">
                  <span className="queueItemLabel">
                    <QueueTeamIcon team={team} />
                    {teamLabel[team] ?? team}
                  </span>
                  <span className="queueBadge">{len}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="muted queueFootnote">
            Valores atualizados pelos testes na seção acima.
          </p>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <span className="dot dotMuted" />
            <span>Atendentes</span>
          </div>
          {!snapshot ? (
            <p className="muted">Carregando…</p>
          ) : (
            <ul className="agentList">
              {snapshot.agents.map((a) => (
                <li key={a.id} className="agentItem">
                  <div className="agentNameBlock">
                    <AgentUserIcon
                      color={getAgentAccentColor(a.id, snapshot.agents)}
                    />
                    <div>
                      <div className="agentName">{a.name}</div>
                      <div className="agentMeta">
                        {teamLabel[a.team] ?? a.team}
                      </div>
                    </div>
                  </div>
                  <div className="loadPill">
                    {a.activeAssignments}/{a.capacity}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
