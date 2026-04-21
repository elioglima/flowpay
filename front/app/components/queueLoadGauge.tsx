"use client";

import { useId } from "react";
import { QUEUE_GAUGE_SCALE_MAX } from "../../lib/dashboardConstants";
import { queueGaugePercent, sumQueueLengths } from "../../lib/queueGaugeUtils";
import type { QueueLengths } from "../../lib/dashboardTypes";

const ARC_PATH = "M 28 100 A 72 72 0 0 1 172 100";

type QueueLoadGaugeProps = {
  queueLengths: QueueLengths | null | undefined;
  scaleMax?: number;
};

export default function QueueLoadGauge({
  queueLengths,
  scaleMax = QUEUE_GAUGE_SCALE_MAX,
}: QueueLoadGaugeProps) {
  const uid = useId().replace(/:/g, "");
  const filterGlowId = `qg-glow-${uid}`;

  const total = sumQueueLengths(queueLengths ?? null);
  const percent = queueGaugePercent(total, scaleMax);
  const rotation =
    180 + (percent / 100) * 180;

  return (
    <div className="queueGaugeWrap">
      <p className="queueGaugeTitle">Carga total na fila</p>
      <div
        className="queueGaugeSvgWrap"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={scaleMax}
        aria-valuenow={total}
        aria-label={`Total na fila: ${total}, escala visual até ${scaleMax}`}
      >
        <svg
          className="queueGaugeSvg"
          viewBox="0 0 200 112"
          width="200"
          height="112"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${uid}-fill`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#5eead4" stopOpacity="1" />
            </linearGradient>
            <filter id={filterGlowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d={ARC_PATH}
            fill="none"
            stroke="rgba(148, 163, 184, 0.22)"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={100}
          />

          <path
            className="queueGaugeFillArc"
            d={ARC_PATH}
            fill="none"
            stroke={`url(#${uid}-fill)`}
            strokeWidth="10"
            strokeLinecap="butt"
            pathLength={100}
            strokeDasharray={`${percent} ${Math.max(0.001, 100 - percent)}`}
            strokeDashoffset={0}
            filter={`url(#${filterGlowId})`}
          />

          <g transform={`rotate(${rotation} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="166"
              y2="100"
              className="queueGaugeNeedle"
              strokeLinecap="round"
            />
          </g>

          <circle className="queueGaugePivot" cx="100" cy="100" r="6" />

          <text x="24" y="108" className="queueGaugeTickLabel" textAnchor="start">
            0
          </text>
          <text x="176" y="108" className="queueGaugeTickLabel" textAnchor="end">
            {scaleMax}
          </text>
        </svg>
      </div>
      <p className="queueGaugeMeta">
        <span className="queueGaugeTotal">{total}</span>
        <span className="queueGaugeSep">/</span>
        <span className="queueGaugeMax">{scaleMax}</span>
        <span className="queueGaugeHint"> registos na fila (soma dos times)</span>
      </p>
    </div>
  );
}
