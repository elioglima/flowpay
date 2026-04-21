import type {
  AutoReleaseScheduleEntry,
  DashboardSnapshot,
} from "../../lib/dashboardTypes";
import { OPEN_PAGE_SIZE } from "../../lib/dashboardConstants";
import { sortOpenTicketsForDisplay } from "../../lib/ticketDisplayUtils";
import OpenTicketRow from "./openTicketRow";

type QueueSimulateKey = "cards" | "loans" | "other" | "mixed" | null;

export type OpenTicketsPanelProps = {
  snapshot: DashboardSnapshot | null;
  openPage: number;
  onOpenPageChange: (page: number) => void;
  pending: string | null;
  queueSimulateKey: QueueSimulateKey;
  autoReleaseEnabled: boolean;
  releaseSchedule: Record<string, AutoReleaseScheduleEntry>;
  onCompleteTicket: (id: string) => Promise<void>;
};

export default function OpenTicketsPanel({
  snapshot,
  openPage,
  onOpenPageChange,
  pending,
  queueSimulateKey,
  autoReleaseEnabled,
  releaseSchedule,
  onCompleteTicket,
}: OpenTicketsPanelProps) {
  return (
    <section className="panel pageBlock ticketBlock">
      <div className="panelHeader">
        <span className="dot" />
        <span>Em aberto (fila + ativo)</span>
      </div>
      {!snapshot ? (
        <p className="muted">Carregando…</p>
      ) : snapshot.openTickets.length === 0 ? (
        <p className="muted">Nenhuma solicitação aberta.</p>
      ) : (
        (() => {
          const sortedOpen = sortOpenTicketsForDisplay(snapshot.openTickets);
          const totalOpen = sortedOpen.length;
          const totalOpenPages = Math.max(
            1,
            Math.ceil(totalOpen / OPEN_PAGE_SIZE)
          );
          const safePage = Math.min(openPage, totalOpenPages);
          const start = (safePage - 1) * OPEN_PAGE_SIZE;
          const pageItems = sortedOpen.slice(start, start + OPEN_PAGE_SIZE);
          const from =
            totalOpen === 0 ? 0 : (safePage - 1) * OPEN_PAGE_SIZE + 1;
          const to = Math.min(safePage * OPEN_PAGE_SIZE, totalOpen);

          return (
            <>
              <ul className="ticketList">
                {pageItems.map((t) => (
                  <OpenTicketRow
                    key={t.id}
                    ticket={t}
                    snapshot={snapshot}
                    pending={pending}
                    queueSimulateKey={queueSimulateKey}
                    autoReleaseEnabled={autoReleaseEnabled}
                    releaseEntry={releaseSchedule[t.id]}
                    onComplete={onCompleteTicket}
                  />
                ))}
              </ul>
              <div className="closedPagination openPagination">
                <p className="closedPaginationMeta muted">
                  Mostrando {from}–{to} de {totalOpen} · Página {safePage} de{" "}
                  {totalOpenPages} · até {OPEN_PAGE_SIZE} por página
                </p>
                <div className="closedPaginationBtns">
                  <button
                    type="button"
                    className="btn btnSmall"
                    disabled={safePage <= 1}
                    onClick={() => onOpenPageChange(Math.max(1, safePage - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="btn btnSmall"
                    disabled={safePage >= totalOpenPages}
                    onClick={() => onOpenPageChange(safePage + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </>
          );
        })()
      )}
    </section>
  );
}
