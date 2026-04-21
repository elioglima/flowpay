export const AUTO_RELEASE_MS = 15000;
export const QUEUE_SIMULATE_BURST = 18;

export const CLOSED_PAGE_SIZE = 10;
export const OPEN_PAGE_SIZE = 20;

export const mixedBatchByTeam = {
  cards: 7,
  loans: 13,
  other: 17,
} as const;

export const teamLabel: Record<string, string> = {
  cards: "Cartões",
  loans: "Empréstimos",
  other: "Outros assuntos",
};
