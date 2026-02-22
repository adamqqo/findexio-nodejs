'use client';

import React, { useMemo, useRef, useState } from 'react';

type Point = { x: number; y: number | null };

function autoUnit(maxAbs: number) {
  const abs = Math.abs(maxAbs);

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

export default function SimpleLineChart({
  title,
  subtitle,
  points,
  height = 160,

  // === NEW: unified axis scaling/labeling ===
  yScaleDivisor = 1,                 // e.g. 1_000_000 for "mil. €"
  ySuffix = '',                      // e.g. ' mil. €'
  yFractionDigits = 1,               // tick precision after scaling
  tooltipValueFormatter              // optional custom tooltip formatter
}: {
  title: string;
  subtitle?: string;
  points: Point[];
  height?: number;

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

  const svgRef = useRef<SVGSVGElement | null>(null);

  const xs = useMemo(() => points.map((p) => p.x), [points]);
  const ysRaw = useMemo(
    () => points.filter((p) => p.y !== null).map((p) => p.y as number),
    [points]
  );

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);

  // IMPORTANT: extent is computed on RAW values (the line uses raw values)
  const { min: yMinRaw, max: yMaxRaw } = niceExtent(ysRaw);
  const maxAbs = Math.max(Math.abs(yMinRaw), Math.abs(yMaxRaw));
  const auto = autoUnit(maxAbs);
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const xScale = (x: number) =>
    padL + (xMax === xMin ? innerW / 2 : ((x - xMin) / (xMax - xMin)) * innerW);

  const yScale = (yRaw: number) =>
    padT + (yMaxRaw === yMinRaw ? innerH / 2 : (1 - (yRaw - yMinRaw) / (yMaxRaw - yMinRaw)) * innerH);

  // Build path, skipping nulls
  const pathD = useMemo(() => {
    let d = '';
    let started = false;
    for (const p of points) {
      if (p.y === null || typeof p.y === 'undefined') {
        started = false;
        continue;
      }
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
  }, [points, xMin, xMax, yMinRaw, yMaxRaw]);

  // Y ticks displayed in SCALED units, but positioned on RAW scale
  const yTicks = 4;
  const tickRawValues = useMemo(
    () => Array.from({ length: yTicks + 1 }, (_, i) => yMinRaw + ((yMaxRaw - yMinRaw) * i) / yTicks),
    [yMinRaw, yMaxRaw]
  );

  const formatTick = (raw: number) => {
    const scaled = raw / auto.div;
    return `${formatNumberSK(scaled, auto.digits)}${auto.suffix}`;
  };

  const formatTooltip = (raw: number) => {
    const scaled = raw / auto.div;
    return `${formatNumberSK(scaled, Math.max(auto.digits, 2))}${auto.suffix}`;
  };

  // === Tooltip state ===
    const [hover, setHover] = useState<{
      year: number;
      rawY: number;
      cx: number;
      cy: number;
      mouseX: number;
      mouseY: number;
    } | null>(null);



  const validPoints = useMemo(
    () => points.filter((p) => p.y !== null) as Array<{ x: number; y: number }>,
    [points]
  );

    function onMouseMove(e: React.MouseEvent) {
      if (!svgRef.current || validPoints.length === 0) return;

      const rect = svgRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;

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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-zinc-500">{subtitle}</div> : null}
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div className="font-medium text-zinc-700">
            {xMin} – {xMax}
          </div>
        </div>
      </div>

      {ysRaw.length === 0 ? (
        <div className="mt-3 text-sm text-zinc-600">Nie sú dostupné dáta pre graf.</div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-[560px]"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            {/* grid + y labels */}
            {tickRawValues.map((tRaw, i) => {
              const y = yScale(tRaw);
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(0,0,0,0.08)" />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(0,0,0,0.55)">
                    {formatTick(tRaw)}
                  </text>
                </g>
              );
            })}

            {/* x axis */}
            <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(0,0,0,0.12)" />
            <text x={padL} y={height - 10} fontSize="10" fill="rgba(0,0,0,0.55)">
              {xMin}
            </text>
            <text x={width - padR} y={height - 10} textAnchor="end" fontSize="10" fill="rgba(0,0,0,0.55)">
              {xMax}
            </text>

            {/* line */}
            <path d={pathD} fill="none" stroke="black" strokeWidth="2" />

            {/* points */}
            {validPoints.map((p, idx) => {
              const cx = xScale(p.x);
              const cy = yScale(p.y);
              return <circle key={idx} cx={cx} cy={cy} r="3" fill="black" />;
            })}

            {/* hover crosshair + marker */}
            {hover ? (
              <g>
                <line
                  x1={hover.cx}
                  y1={padT}
                  x2={hover.cx}
                  y2={height - padB}
                  stroke="rgba(0,0,0,0.15)"
                  strokeDasharray="4 4"
                />
                <circle cx={hover.cx} cy={hover.cy} r="5" fill="white" stroke="black" strokeWidth="2" />
              </g>
            ) : null}
          </svg>
        </div>
      )}

      {/* Tooltip */}
      {hover ? (
        <TooltipFollowCursor hover={hover} formatTooltip={formatTooltip} />
      ) : null}
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

    if (left + tooltipWidth > viewportWidth - padding) {
      left = hover.mouseX - tooltipWidth - 14;
    }

    if (top < padding) {
      top = hover.mouseY + 14;
    }

    setPos({ left, top });
  }, [hover]);

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg"
      style={{
        left: pos.left,
        top: pos.top
      }}
    >
      <div className="font-medium text-zinc-900">{hover.year}</div>
      <div className="text-zinc-600">{formatTooltip(hover.rawY)}</div>
    </div>
  );
}
