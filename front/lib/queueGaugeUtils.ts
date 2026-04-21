import type { QueueLengths } from "./dashboardTypes";

export function sumQueueLengths(q: QueueLengths | null | undefined): number {
  if (!q) {
    return 0;
  }
  return Object.values(q).reduce(
    (acc, n) => acc + (typeof n === "number" && !Number.isNaN(n) ? n : 0),
    0
  );
}

export function queueGaugePercent(total: number, scaleMax: number): number {
  if (scaleMax <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (total / scaleMax) * 100));
}
