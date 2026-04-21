"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ClosedTicketsPage,
  DashboardSnapshot,
} from "../lib/dashboardTypes";
import {
  CLOSED_PAGE_SIZE,
  mixedBatchByTeam,
  OPEN_PAGE_SIZE,
  QUEUE_SIMULATE_BURST,
} from "../lib/dashboardConstants";
import { getApiBaseUrl } from "../lib/getApiBaseUrl";
import {
  SUBJECT_CARD_ISSUE,
  SUBJECT_LOAN_CONTRACT,
  SUBJECT_OTHER_SAMPLE,
} from "../lib/subjectCatalog";
import { getAutoReleaseDeadlineMs } from "../lib/ticketDisplayUtils";
import ClosedTicketsPanel from "./components/closedTicketsPanel";
import DashboardFooter from "./components/dashboardFooter";
import DashboardHeader from "./components/dashboardHeader";
import ErrorBanner from "./components/errorBanner";
import MonitoringSection from "./components/monitoringSection";
import OpenTicketsPanel from "./components/openTicketsPanel";
import QueuesAndAgentsGrid from "./components/queuesAndAgentsGrid";
import SimulationPanel from "./components/simulationPanel";

export default function DashboardShell() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [autoReleaseEnabled, setAutoReleaseEnabled] = useState(true);
  const [tick, setTick] = useState(0);
  const [queueSimulateKey, setQueueSimulateKey] = useState<
    "cards" | "loans" | "other" | "mixed" | null
  >(null);
  const [closedSearchInput, setClosedSearchInput] = useState("");
  const [closedSearch, setClosedSearch] = useState("");
  const [closedPage, setClosedPage] = useState(1);
  const [closedData, setClosedData] = useState<ClosedTicketsPage | null>(null);
  const [closedLoading, setClosedLoading] = useState(false);
  const [closedFetchError, setClosedFetchError] = useState(false);
  const [dashboardNonce, setDashboardNonce] = useState(0);
  const [resetBusy, setResetBusy] = useState(false);
  const [openPage, setOpenPage] = useState(1);
  const autoTriggered = useRef(new Set<string>());

  const applyPayload = useCallback((data: unknown) => {
    if (
      data &&
      typeof data === "object" &&
      "payload" in data &&
      (data as { type?: string }).type === "dashboard"
    ) {
      setSnapshot((data as { payload: DashboardSnapshot }).payload);
      setError(null);
      setDashboardNonce((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    const base = getApiBaseUrl();
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${base}/api/dashboard`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const body = (await res.json()) as DashboardSnapshot;
        if (!cancelled) {
          setSnapshot(body);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar o painel. Verifique a API.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const base = getApiBaseUrl();
    const es = new EventSource(`${base}/api/stream`);
    es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data as string) as unknown;
        applyPayload(parsed);
      } catch {
        setError("Evento inválido do servidor.");
      }
    };
    return () => {
      es.close();
    };
  }, [applyPayload]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setClosedSearch(closedSearchInput);
    }, 400);
    return () => window.clearTimeout(id);
  }, [closedSearchInput]);

  useEffect(() => {
    setClosedPage(1);
  }, [closedSearch]);

  const fetchClosedTickets = useCallback(async () => {
    setClosedLoading(true);
    try {
      const base = getApiBaseUrl();
      const params = new URLSearchParams({
        page: String(closedPage),
        pageSize: String(CLOSED_PAGE_SIZE),
      });
      if (closedSearch.trim()) {
        params.set("q", closedSearch.trim());
      }
      const res = await fetch(`${base}/api/tickets/closed?${params}`);
      if (!res.ok) {
        throw new Error("closed list failed");
      }
      const data = (await res.json()) as ClosedTicketsPage;
      setClosedData(data);
      setClosedFetchError(false);
    } catch {
      setClosedData(null);
      setClosedFetchError(true);
    } finally {
      setClosedLoading(false);
    }
  }, [closedPage, closedSearch]);

  useEffect(() => {
    void fetchClosedTickets();
  }, [fetchClosedTickets, dashboardNonce]);

  async function postTicketRequest(subject: string) {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }
  }

  async function createTicket(subject: string) {
    setPending(subject);
    setError(null);
    try {
      await postTicketRequest(subject);
    } catch {
      setError("Falha ao criar solicitação.");
    } finally {
      setPending(null);
    }
  }

  async function simulateQueueBurst(teamKey: "cards" | "loans" | "other") {
    const subjects = {
      cards: SUBJECT_CARD_ISSUE,
      loans: SUBJECT_LOAN_CONTRACT,
      other: SUBJECT_OTHER_SAMPLE,
    } as const;
    const subject = subjects[teamKey];
    setQueueSimulateKey(teamKey);
    setError(null);
    try {
      for (let i = 0; i < QUEUE_SIMULATE_BURST; i++) {
        await postTicketRequest(subject);
      }
    } catch {
      setError("Falha ao simular fila.");
    } finally {
      setQueueSimulateKey(null);
    }
  }

  async function simulateBatchMixed() {
    setQueueSimulateKey("mixed");
    setError(null);
    try {
      for (let i = 0; i < mixedBatchByTeam.cards; i++) {
        await postTicketRequest(SUBJECT_CARD_ISSUE);
      }
      for (let i = 0; i < mixedBatchByTeam.loans; i++) {
        await postTicketRequest(SUBJECT_LOAN_CONTRACT);
      }
      for (let i = 0; i < mixedBatchByTeam.other; i++) {
        await postTicketRequest(SUBJECT_OTHER_SAMPLE);
      }
    } catch {
      setError("Falha ao simular fila.");
    } finally {
      setQueueSimulateKey(null);
    }
  }

  const completeTicket = useCallback(async (id: string) => {
    const base = getApiBaseUrl();
    setPending(id);
    setError(null);
    try {
      const res = await fetch(`${base}/api/tickets/${id}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      setError("Falha ao encerrar atendimento.");
      throw new Error("complete failed");
    } finally {
      setPending(null);
    }
  }, []);

  const resetSimulation = useCallback(async () => {
    const base = getApiBaseUrl();
    setResetBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/api/tickets/reset`, { method: "POST" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      autoTriggered.current.clear();
      setOpenPage(1);
      const dash = await fetch(`${base}/api/dashboard`);
      if (dash.ok) {
        const body = (await dash.json()) as DashboardSnapshot;
        setSnapshot(body);
        setDashboardNonce((n) => n + 1);
      }
    } catch {
      setError("Falha ao reiniciar a simulação.");
    } finally {
      setResetBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!snapshot) {
      return;
    }
    const total = snapshot.openTickets.length;
    const pages = Math.max(1, Math.ceil(total / OPEN_PAGE_SIZE));
    setOpenPage((p) => Math.min(Math.max(1, p), pages));
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }
    const activeIds = new Set(
      snapshot.openTickets
        .filter((x) => x.status === "active")
        .map((x) => x.id)
    );
    for (const id of autoTriggered.current) {
      if (!activeIds.has(id)) {
        autoTriggered.current.delete(id);
      }
    }
  }, [snapshot]);

  useEffect(() => {
    if (!autoReleaseEnabled || !snapshot) {
      return;
    }
    const now = Date.now();
    for (const t of snapshot.openTickets) {
      if (t.status !== "active") {
        continue;
      }
      const deadline = getAutoReleaseDeadlineMs(t);
      if (deadline === null) {
        continue;
      }
      if (now >= deadline && !autoTriggered.current.has(t.id)) {
        autoTriggered.current.add(t.id);
        void completeTicket(t.id).catch(() => {
          autoTriggered.current.delete(t.id);
        });
      }
    }
  }, [snapshot, autoReleaseEnabled, tick, completeTicket]);

  return (
    <main className="shell shellWide pageRoot">
      <div className="glow" aria-hidden />
      <DashboardHeader />

      <SimulationPanel
        resetBusy={resetBusy}
        pending={pending}
        queueSimulateKey={queueSimulateKey}
        autoReleaseEnabled={autoReleaseEnabled}
        onAutoReleaseChange={setAutoReleaseEnabled}
        onReset={resetSimulation}
        onCreateTicket={(subject) => void createTicket(subject)}
        onSimulateQueueBurst={(team) => void simulateQueueBurst(team)}
        onSimulateBatchMixed={() => void simulateBatchMixed()}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <QueuesAndAgentsGrid snapshot={snapshot} />

      <OpenTicketsPanel
        snapshot={snapshot}
        openPage={openPage}
        onOpenPageChange={setOpenPage}
        pending={pending}
        queueSimulateKey={queueSimulateKey}
        autoReleaseEnabled={autoReleaseEnabled}
        onCompleteTicket={completeTicket}
      />

      <MonitoringSection snapshot={snapshot} />

      <ClosedTicketsPanel
        closedSearchInput={closedSearchInput}
        onClosedSearchInputChange={setClosedSearchInput}
        closedPage={closedPage}
        onClosedPageChange={setClosedPage}
        closedData={closedData}
        closedLoading={closedLoading}
        closedFetchError={closedFetchError}
      />

      <DashboardFooter />
    </main>
  );
}
