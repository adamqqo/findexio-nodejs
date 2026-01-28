'use client';

import React from 'react';

type Point = { x: number; y: number | null };

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

export default function SimpleLineChart({
  title,
  subtitle,
  points,
  height = 140,
  fmtY
}: {
  title: string;
  subtitle?: string;
  points: Point[];
  height?: number;
  fmtY?: (y: number) => string;
}) {
  const width = 600; // viewBox width
  const padL = 40;
  const padR = 10;
  const padT = 12;
  const padB = 26;

  const xs = points.map((p) => p.x);
  const ys = points.filter((p) => p.y !== null).map((p) => p.y as number);

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const { min: yMin, max: yMax } = niceExtent(ys);

  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const xScale = (x: number) =>
    padL + (xMax === xMin ? innerW / 2 : ((x - xMin) / (xMax - xMin)) * innerW);

  const yScale = (y: number) =>
    padT + (yMax === yMin ? innerH / 2 : (1 - (y - yMin) / (yMax - yMin)) * innerH);

  // Build path, skipping nulls
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

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);

  const fmt = fmtY ?? ((v) => v.toFixed(2));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-zinc-500">{subtitle}</div> : null}
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div className="font-medium text-zinc-700">{xMin} – {xMax}</div>
        </div>
      </div>

      {ys.length === 0 ? (
        <div className="mt-3 text-sm text-zinc-600">Nie sú dostupné dáta pre graf.</div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[520px]">
            {/* grid + y labels */}
            {ticks.map((t, i) => {
              const y = yScale(t);
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(0,0,0,0.08)" />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(0,0,0,0.55)">
                    {fmt(t)}
                  </text>
                </g>
              );
            })}

            {/* x axis labels */}
            <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(0,0,0,0.12)" />
            <text x={padL} y={height - 8} fontSize="10" fill="rgba(0,0,0,0.55)">
              {xMin}
            </text>
            <text x={width - padR} y={height - 8} textAnchor="end" fontSize="10" fill="rgba(0,0,0,0.55)">
              {xMax}
            </text>

            {/* line */}
            <path d={d} fill="none" stroke="black" strokeWidth="2" />

            {/* points */}
            {points.map((p, idx) => {
              if (p.y === null || typeof p.y === 'undefined') return null;
              const cx = xScale(p.x);
              const cy = yScale(p.y);
              return <circle key={idx} cx={cx} cy={cy} r="3" fill="black" />;
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
