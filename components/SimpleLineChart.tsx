'use client';

import React, { useMemo, useRef, useState } from 'react';

type Point = { x: number; y: number | null };

type AutoUnitMode = 'plain' | 'eur';

function autoScale(maxAbs: number, mode: AutoUnitMode) {
  const abs = Math.abs(maxAbs);

  // plain: scale without currency suffix (good for ratios/score)
  if (mode === 'plain') {
    if (abs >= 1_000_000_000) return { div: 1_000_000_000, suffix: ' mld.', digits: 2 };
    if (abs >= 1_000_000) return { div: 1_000_000, suffix: ' mil.', digits: 1 };
    if (abs >= 1_000) return { div: 1_000, suffix: ' tis.', digits: 1 };
    return { div: 1, suffix: '', digits: 0 };
  }

  // eur: scale with € suffix
  if (abs >= 1_000_000_000) return { div: 1_000_000_000, suffix: ' mld. €', digits: 2 };
  if (abs >= 1_000_000) return { div: 1_000_000, suffix: ' mil. €', digits: 1 };
  if (abs >= 1_000) return { div: 1_000, suffix: ' tis. €', digits: 1 };

  return { div: 1, suffix: ' €', digits: 0 };
}

function niceExtent(values: number[]) {
  if (values.length === 0) return { min: 0, max: 1 };

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    const bump = Math.abs(min) > 1 ? Math.abs(min) * 0.1 : 1;
    min -= bump;
    max += bump;
  }

  return { min, max };
}

function formatNumberSK(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat('sk-SK', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

function toNum(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x === 'string' && x.trim() !== '') {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function SimpleLineChart({
  title,
  subtitle,
  points,
  height = 160,

  // axis control
  autoUnit = 'plain',
  yScaleDivisor = 1,
  ySuffix = '',
  yFractionDigits = 1,

  tooltipValueFormatter
}: {
  title: string;
  subtitle?: string;
  points: Point[];
  height?: number;

  autoUnit?: AutoUnitMode;

  yScaleDivisor?: number;
  ySuffix?: string;
  yFractionDigits?: number;
  tooltipValueFormatter?: (rawY: number) => string;
}) {
  const width = 640;

  const padL = 56;
  const padR = 12;
  const padT = 12;
  const padB = 30;

  const VB_W = width;
  const VB_H = height;

  const svgRef = useRef<SVGSVGElement | null>(null);

  const xs = useMemo(() => points.map((p) => p.x), [points]);

  const ysRaw = useMemo(
    () =>
      points
        .map((p) => toNum(p.y))
        .filter((v): v is number => v !== null),
    [points]
  );

  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMax = xs.length ? Math.max(...xs) : 1;

  const { min: yMinRaw, max: yMaxRaw } = niceExtent(ysRaw);

  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const xScale = (x: number) =>
    padL + (xMax === xMin ? innerW / 2 : ((x - xMin) / (xMax - xMin)) * innerW);

  const yScale = (yRaw: number) =>
    padT +
    (yMaxRaw === yMinRaw ? innerH / 2 : (1 - (yRaw - yMinRaw) / (yMaxRaw - yMinRaw)) * innerH);

  const validPoints = useMemo(
    () =>
      points
        .map((p) => ({ x: p.x, y: toNum(p.y) }))
        .filter((p): p is { x: number; y: number } => p.y !== null),
    [points]
  );

  const pathD = useMemo(() => {
    let d = '';
    let started = false;

    for (const p of validPoints) {
      const X = xScale(p.x);
      const Y = yScale(p.y);

      if (!started) {
        d += `M ${X} ${Y}`;
        started = true;
      } else {
        d += ` L ${X} ${Y}`;
      }
    }

    return d;
  }, [validPoints, xMin, xMax, yMinRaw, yMaxRaw]);

  const yTicks = 4;

  const tickRawValues = useMemo(
    () => Array.from({ length: yTicks + 1 }, (_, i) => yMinRaw + ((yMaxRaw - yMinRaw) * i) / yTicks),
    [yMinRaw, yMaxRaw]
  );

  // If caller sets suffix/divisor explicitly (like % or score), do NOT use auto scaling.
  const useCustomAxis = (ySuffix && ySuffix.trim() !== '') || yScaleDivisor !== 1;

  const auto = useMemo(() => {
    const maxAbs = Math.max(Math.abs(yMinRaw), Math.abs(yMaxRaw));
    return autoScale(maxAbs, autoUnit);
  }, [yMinRaw, yMaxRaw, autoUnit]);

  const formatTick = (raw: number) => {
    if (useCustomAxis) {
      const scaled = raw / yScaleDivisor;
      return `${formatNumberSK(scaled, yFractionDigits)}${ySuffix}`;
    }

    const scaled = raw / auto.div;
    return `${formatNumberSK(scaled, auto.digits)}${auto.suffix}`;
  };

  const formatTooltip = (raw: number) => {
    if (tooltipValueFormatter) return tooltipValueFormatter(raw);

    if (useCustomAxis) {
      const scaled = raw / yScaleDivisor;
      return `${formatNumberSK(scaled, Math.max(yFractionDigits, 2))}${ySuffix}`;
    }

    const scaled = raw / auto.div;
    return `${formatNumberSK(scaled, Math.max(auto.digits, 2))}${auto.suffix}`;
  };

  const [hover, setHover] = useState<{
    year: number;
    rawY: number;
    cx: number;
    cy: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || validPoints.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * VB_W;

    let best = validPoints[0];
    let bestDx = Infinity;

    for (const p of validPoints) {
      const px = xScale(p.x);
      const dx = Math.abs(px - mx);

      if (dx < bestDx) {
        bestDx = dx;
        best = p;
      }
    }

    const cx = xScale(best.x);
    const cy = yScale(best.y);

    setHover({
      year: best.x,
      rawY: best.y,
      cx,
      cy,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  }

  function onMouseLeave() {
    setHover(null);
  }

  return (
    <div className="relative rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-400">{subtitle}</div> : null}
        </div>

        <div className="text-right text-xs text-slate-400">
          <div className="font-medium text-slate-300">
            {xMin} – {xMax}
          </div>
        </div>
      </div>

      {ysRaw.length === 0 ? (
        <div className="mt-3 text-sm text-slate-300">Nie sú dostupné dáta pre graf.</div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-[560px]"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            {tickRawValues.map((tRaw, i) => {
              const y = yScale(tRaw);

              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(148,163,184,0.18)" />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(203,213,225,0.8)">
                    {formatTick(tRaw)}
                  </text>
                </g>
              );
            })}

            <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(148,163,184,0.25)" />

            <text x={padL} y={height - 10} fontSize="10" fill="rgba(203,213,225,0.8)">
              {xMin}
            </text>

            <text x={width - padR} y={height - 10} textAnchor="end" fontSize="10" fill="rgba(203,213,225,0.8)">
              {xMax}
            </text>

            <path d={pathD} fill="none" stroke="#51c7e9" strokeWidth="2" />

            {validPoints.map((p, idx) => {
              const cx = xScale(p.x);
              const cy = yScale(p.y);
              return <circle key={idx} cx={cx} cy={cy} r="3" fill="#f5be42" />;
            })}

            {hover ? (
              <g>
                <line
                  x1={hover.cx}
                  y1={padT}
                  x2={hover.cx}
                  y2={height - padB}
                  stroke="rgba(148,163,184,0.35)"
                  strokeDasharray="4 4"
                />

                <circle cx={hover.cx} cy={hover.cy} r="5" fill="#081025" stroke="#51c7e9" strokeWidth="2" />
              </g>
            ) : null}
          </svg>
        </div>
      )}

      {hover ? <TooltipFollowCursor hover={hover} formatTooltip={formatTooltip} /> : null}
    </div>
  );
}

function TooltipFollowCursor({
  hover,
  formatTooltip
}: {
  hover: {
    year: number;
    rawY: number;
    mouseX: number;
    mouseY: number;
  };
  formatTooltip: (raw: number) => string;
}) {
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState({ left: 0, top: 0 });

  React.useEffect(() => {
    if (!tooltipRef.current) return;

    const padding = 12;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = hover.mouseX + 14;
    let top = hover.mouseY - tooltipHeight - 14;

    if (left + tooltipWidth > viewportWidth - padding) left = hover.mouseX - tooltipWidth - 14;
    if (top < padding) top = hover.mouseY + 14;
    if (top + tooltipHeight > viewportHeight - padding) top = Math.max(padding, viewportHeight - padding - tooltipHeight);

    setPos({ left, top });
  }, [hover]);

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="font-medium text-white">{hover.year}</div>
      <div className="text-slate-300">{formatTooltip(hover.rawY)}</div>
    </div>
  );
}