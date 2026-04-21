import type { ClosedTicketsPage } from "../../lib/dashboardTypes";
import { teamLabel } from "../../lib/dashboardConstants";
import { getClosedTicketsDisplayRange } from "../../lib/closedTicketsRangeUtils";
import { formatTicketDateTime } from "../../lib/ticketDisplayUtils";
import { QueueTeamIcon } from "../../lib/queueTeamIcons";

export type ClosedTicketsPanelProps = {
  closedSearchInput: string;
  onClosedSearchInputChange: (value: string) => void;
  closedPage: number;
  onClosedPageChange: (page: number) => void;
  closedData: ClosedTicketsPage | null;
  closedLoading: boolean;
  closedFetchError: boolean;
};

export default function ClosedTicketsPanel({
  closedSearchInput,
  onClosedSearchInputChange,
  closedPage,
  onClosedPageChange,
  closedData,
  closedLoading,
  closedFetchError,
}: ClosedTicketsPanelProps) {
  const searchTrimmed = closedSearchInput.trim();

  return (
    <section className="panel pageBlock ticketBlock closedSection">
      <div className="panelHeader">
        <span className="dot dotMuted" />
        <span>Encerrados recentes</span>
      </div>
      <div className="closedToolbar">
        <label className="closedSearchLabel" htmlFor="closed-search">
          Pesquisar por assunto
        </label>
        <input
          id="closed-search"
          type="search"
          className="closedSearchInput"
          placeholder="Ex.: cartão, empréstimo…"
          value={closedSearchInput}
          onChange={(e) => onClosedSearchInputChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      {closedFetchError ? (
        <p className="muted">Não foi possível carregar os encerrados.</p>
      ) : closedLoading && !closedData ? (
        <p className="muted">Carregando…</p>
      ) : !closedData || closedData.total === 0 ? (
        <p className="muted">
          {searchTrimmed
            ? "Nenhum resultado para essa pesquisa."
            : "Nenhum histórico ainda."}
        </p>
      ) : (
        <>
          <ul
            className={`ticketList mutedList ${closedLoading ? "closedListDim" : ""}`}
          >
            {closedData.items.map((t) => (
              <li key={t.id} className="ticketRow">
                <div className="ticketMainCol">
                  <div className="ticketSubjectRow">
                    <QueueTeamIcon team={t.team} />
                    <div className="ticketSubject">{t.subject}</div>
                  </div>
                  <div className="ticketMeta ticketMetaLine">
                    {teamLabel[t.team] ?? t.team}
                    {t.agentName ? ` · ${t.agentName}` : ""}
                    {" · "}Criação · {formatTicketDateTime(t.createdAt)}
                    {" · "}Execução · {formatTicketDateTime(t.closedAt ?? null)}
                  </div>
                </div>
                <span className="tag tagDone">Concluído</span>
              </li>
            ))}
          </ul>
          <div className="closedPagination">
            <p className="closedPaginationMeta muted">
              {(() => {
                const { from, to, totalPages } =
                  getClosedTicketsDisplayRange(closedData);
                const total = closedData.total;
                return (
                  <>
                    Mostrando {from}–{to} de {total} · Página {closedData.page} de{" "}
                    {totalPages}
                  </>
                );
              })()}
            </p>
            <div className="closedPaginationBtns">
              <button
                type="button"
                className="btn btnSmall"
                disabled={closedPage <= 1 || closedLoading}
                onClick={() => onClosedPageChange(Math.max(1, closedPage - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btnSmall"
                disabled={
                  closedLoading ||
                  closedPage >=
                    Math.max(
                      1,
                      Math.ceil(closedData.total / closedData.pageSize)
                    )
                }
                onClick={() => onClosedPageChange(closedPage + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
