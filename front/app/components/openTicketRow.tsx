import type { CSSProperties } from "react";
import type {
  AutoReleaseScheduleEntry,
  DashboardSnapshot,
  DashboardTicket,
} from "../../lib/dashboardTypes";
import { teamLabel } from "../../lib/dashboardConstants";
import { getAgentAccentColor } from "../../lib/agentAccentColors";
import { QueueTeamIcon } from "../../lib/queueTeamIcons";
import { formatTicketDateTime } from "../../lib/ticketDisplayUtils";

type OpenTicketRowProps = {
  ticket: DashboardTicket;
  snapshot: DashboardSnapshot;
  pending: string | null;
  queueSimulateKey: "cards" | "loans" | "other" | "mixed" | null;
  autoReleaseEnabled: boolean;
  releaseEntry: AutoReleaseScheduleEntry | undefined;
  onComplete: (id: string) => Promise<void>;
};

export default function OpenTicketRow({
  ticket: t,
  snapshot,
  pending,
  queueSimulateKey,
  autoReleaseEnabled,
  releaseEntry,
  onComplete,
}: OpenTicketRowProps) {
  const busy = !!pending || !!queueSimulateKey;
  const deadlineMs = releaseEntry?.deadlineMs;
  const durationMs = releaseEntry?.durationMs ?? 1;
  const showCountdown =
    autoReleaseEnabled && releaseEntry !== undefined && deadlineMs !== undefined;
  const agentAccent =
    t.status === "active"
      ? getAgentAccentColor(t.agentId, snapshot.agents)
      : undefined;

  return (
    <li
      className={`ticketRow ${
        t.status === "active"
          ? `ticketRowActive${agentAccent ? " ticketRowActiveByAgent" : ""}`
          : "ticketRowQueued"
      }`}
      style={
        agentAccent
          ? ({
              "--ticket-agent-accent": agentAccent,
            } as CSSProperties)
          : undefined
      }
    >
      <div className="ticketRowOpenBody">
        <div className="ticketIconCol" data-team={t.team}>
          <QueueTeamIcon team={t.team} variant="hero" />
        </div>
        <div className="ticketMainCol">
          <div className="ticketSubject">{t.subject}</div>
          <div className="ticketMeta ticketMetaLine">
            {teamLabel[t.team] ?? t.team} ·{" "}
            {t.status === "queued" ? (
              "Na fila"
            ) : (
              <>Em atendimento · {t.agentName ?? "atendente"}</>
            )}
            {" · "}Criação · {formatTicketDateTime(t.createdAt)}
            {" · "}
            {t.status === "active"
              ? `Execução · ${formatTicketDateTime(t.activeAt ?? t.createdAt ?? null)}`
              : "Execução · pendente"}
          </div>
        </div>
      </div>
      {t.status === "active" ? (
        <div className="ticketActions">
          {showCountdown ? (
            <div className="countdownWrap">
              <div className="countdownBar">
                <div
                  className="countdownFill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((deadlineMs - Date.now()) / durationMs) * 100
                      )
                    )}%`,
                    ...(agentAccent
                      ? {
                          background: `linear-gradient(90deg, ${agentAccent}, #bae6fd)`,
                        }
                      : {}),
                  }}
                />
              </div>
              <span className="countdownText">
                {(() => {
                  const d = deadlineMs - Date.now();
                  if (d <= 0) {
                    return "Liberando…";
                  }
                  return `${Math.ceil(d / 1000)}s`;
                })()}
              </span>
            </div>
          ) : null}
          <button
            type="button"
            className="btn btnSmall"
            disabled={busy}
            onClick={() => {
              void onComplete(t.id).catch(() => {});
            }}
          >
            {pending === t.id ? "…" : "Encerrar"}
          </button>
        </div>
      ) : (
        <span className="tag">Fila</span>
      )}
    </li>
  );
}
