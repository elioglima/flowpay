import {
  AUTO_RELEASE_MS_MAX,
  AUTO_RELEASE_MS_MIN,
  mixedBatchByTeam,
  QUEUE_SIMULATE_BURST,
} from "../../lib/dashboardConstants";
import {
  SUBJECT_CARD_ISSUE,
  SUBJECT_LOAN_CONTRACT,
  SUBJECT_OTHER_SAMPLE,
} from "../../lib/subjectCatalog";

type QueueSimulateKey = "cards" | "loans" | "other" | "mixed" | null;

export type SimulationPanelProps = {
  resetBusy: boolean;
  pending: string | null;
  queueSimulateKey: QueueSimulateKey;
  autoReleaseEnabled: boolean;
  onAutoReleaseChange: (enabled: boolean) => void;
  onReset: () => void;
  onCreateTicket: (subject: string) => void;
  onSimulateQueueBurst: (team: "cards" | "loans" | "other") => void;
  onSimulateBatchMixed: () => void;
};

export default function SimulationPanel({
  resetBusy,
  pending,
  queueSimulateKey,
  autoReleaseEnabled,
  onAutoReleaseChange,
  onReset,
  onCreateTicket,
  onSimulateQueueBurst,
  onSimulateBatchMixed,
}: SimulationPanelProps) {
  const busy = !!pending || !!queueSimulateKey;

  return (
    <section className="panel actionsPanel">
      <div className="panelHeader panelHeaderRow">
        <div className="panelHeaderTitle">
          <span className="dot" />
          <span>Testes e simulação</span>
        </div>
        <button
          type="button"
          className="btn btnReset btnSmall"
          disabled={busy || resetBusy}
          onClick={() => void onReset()}
        >
          {resetBusy ? "Reiniciando…" : "Reiniciar tudo"}
        </button>
      </div>
      <p className="muted smallGap">
        A API distribui respeitando o teto de 3 ativos por atendente. Use os botões
        para testar; os painéis abaixo acompanham o resultado (SSE).
      </p>
      <label className="toggleRow">
        <input
          type="checkbox"
          checked={autoReleaseEnabled}
          onChange={(e) => onAutoReleaseChange(e.target.checked)}
        />
        <span>
          Simulação: encerrar cada atendimento ativo automaticamente após um
          intervalo aleatório entre {AUTO_RELEASE_MS_MIN / 1000} e{" "}
          {AUTO_RELEASE_MS_MAX / 1000}s por pedido (cada ticket com o seu timer;
          até 3 por atendente)
        </span>
      </label>
      <p className="testBlockTitle">Pedido único (roteamento)</p>
      <p className="muted microGap">
        Assunto exato esperado pela API: cartão, empréstimo ou outros.
      </p>
      <div className="btnRow">
        <button
          type="button"
          className="btn btnPrimary"
          disabled={busy}
          onClick={() => void onCreateTicket(SUBJECT_CARD_ISSUE)}
        >
          {pending === SUBJECT_CARD_ISSUE ? "Enviando…" : "Problemas com cartão"}
        </button>
        <button
          type="button"
          className="btn btnPrimary"
          disabled={busy}
          onClick={() => void onCreateTicket(SUBJECT_LOAN_CONTRACT)}
        >
          {pending === SUBJECT_LOAN_CONTRACT
            ? "Enviando…"
            : "Contratação de empréstimo"}
        </button>
        <button
          type="button"
          className="btn btnGhost"
          disabled={busy}
          onClick={() => void onCreateTicket(SUBJECT_OTHER_SAMPLE)}
        >
          {pending === SUBJECT_OTHER_SAMPLE ? "Enviando…" : "Outro assunto"}
        </button>
      </div>
      <p className="testBlockTitle">Lotes por time</p>
      <p className="muted simHint tightTop">
        Cada time tem 2 atendentes × 3 vagas = 6 ativos. Nos lotes por time são
        enviados {QUEUE_SIMULATE_BURST} pedidos do mesmo assunto para lotar e
        mostrar espera na fila. O lote misto envia {mixedBatchByTeam.cards}{" "}
        cartões, {mixedBatchByTeam.loans} empréstimos e {mixedBatchByTeam.other}{" "}
        outros, em sequência.
      </p>
      <div className="simulateRow simulateRowTop">
        <button
          type="button"
          className="btn btnSim"
          disabled={busy}
          onClick={() => void onSimulateQueueBurst("cards")}
        >
          {queueSimulateKey === "cards" ? "Enviando…" : "Lote · Cartões"}
        </button>
        <button
          type="button"
          className="btn btnSim"
          disabled={busy}
          onClick={() => void onSimulateQueueBurst("loans")}
        >
          {queueSimulateKey === "loans" ? "Enviando…" : "Lote · Empréstimos"}
        </button>
        <button
          type="button"
          className="btn btnSim"
          disabled={busy}
          onClick={() => void onSimulateQueueBurst("other")}
        >
          {queueSimulateKey === "other" ? "Enviando…" : "Lote · Outros assuntos"}
        </button>
        <button
          type="button"
          className="btn btnSim btnSimRandom"
          disabled={busy}
          onClick={() => void onSimulateBatchMixed()}
        >
          {queueSimulateKey === "mixed"
            ? "Enviando…"
            : `Lote misto · ${mixedBatchByTeam.cards}+${mixedBatchByTeam.loans}+${mixedBatchByTeam.other}`}
        </button>
      </div>
    </section>
  );
}
