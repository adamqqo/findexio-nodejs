'use client';

import { useEffect, useMemo, useState } from 'react';
import SimpleLineChart from './SimpleLineChart';

function formatNumberSK(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat('sk-SK', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

type GradeRow = {
  fiscal_year: number;
  grade: string | null;
  score_total: number | null;
};

type FeatureSeriesRow = {
  fiscal_year: number;
  current_ratio: number | null;
  debt_ratio: number | null;
  equity_ratio: number | null;
  roa: number | null;
  roe: number | null;
  net_margin: number | null;
};

type AggregateRow = {
  fiscal_year: number;
  revenue: number | null;
  net_income: number | null;
  ebit: number | null;
  total_assets: number | null;
  equity: number | null;
};

export default function CompanyCharts({ ico }: { ico: string }) {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [features, setFeatures] = useState<FeatureSeriesRow[]>([]);
  const [aggregates, setAggregates] = useState<AggregateRow[]>([]);
  const [error, setError] = useState<string | null>(null);

function toNum(x: unknown): number | null {
  if (x === null || typeof x === 'undefined') return null;
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x === 'string' && x.trim() !== '') {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      setError(null);
      const res = await fetch(`/api/company/${encodeURIComponent(ico)}/timeseries`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (cancelled) return;

      const rawGrades = (data.grades ?? []) as any[];
      const rawFeatures = (data.featuresSeries ?? []) as any[];
      const rawAgg = (data.aggregates ?? []) as any[];

      setGrades(
        rawGrades.map((g) => ({
          fiscal_year: Number(g.fiscal_year),
          grade: g.grade ?? null,
          score_total: toNum(g.score_total)
        }))
      );

      setFeatures(
        rawFeatures.map((f) => ({
          fiscal_year: Number(f.fiscal_year),
          current_ratio: toNum(f.current_ratio),
          debt_ratio: toNum(f.debt_ratio),
          equity_ratio: toNum(f.equity_ratio),
          roa: toNum(f.roa),
          roe: toNum(f.roe),
          net_margin: toNum(f.net_margin)
        }))
      );

      setAggregates(
        rawAgg.map((a) => ({
          fiscal_year: Number(a.fiscal_year),
          revenue: toNum(a.revenue),
          net_income: toNum(a.net_income),
          ebit: toNum(a.ebit),
          total_assets: toNum(a.total_assets),
          equity: toNum(a.equity)
        }))
      );
    } catch (e: any) {
      if (!cancelled) setError(String(e?.message ?? e));
    }
  })();

  return () => {
    cancelled = true;
  };
}, [ico]);

  // --- Points ---
  const revenuePoints = useMemo(
    () => aggregates.map((a) => ({ x: a.fiscal_year, y: a.revenue ?? null })),
    [aggregates]
  );
  const netIncomePoints = useMemo(
    () => aggregates.map((a) => ({ x: a.fiscal_year, y: a.net_income ?? null })),
    [aggregates]
  );
  const ebitPoints = useMemo(
    () => aggregates.map((a) => ({ x: a.fiscal_year, y: a.ebit ?? null })),
    [aggregates]
  );
  const assetsPoints = useMemo(
    () => aggregates.map((a) => ({ x: a.fiscal_year, y: a.total_assets ?? null })),
    [aggregates]
  );
  const equityAbsPoints = useMemo(
    () => aggregates.map((a) => ({ x: a.fiscal_year, y: a.equity ?? null })),
    [aggregates]
  );

  const scorePoints = useMemo(
    () => grades.map((g) => ({ x: g.fiscal_year, y: g.score_total ?? null })),
    [grades]
  );

  const marginPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.net_margin ?? null })),
    [features]
  );
  const roaPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.roa ?? null })),
    [features]
  );
  const roePoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.roe ?? null })),
    [features]
  );
  const debtPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.debt_ratio ?? null })),
    [features]
  );
  const equityRatioPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.equity_ratio ?? null })),
    [features]
  );
  const liquidityPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.current_ratio ?? null })),
    [features]
  );

  const hasAnyData =
    revenuePoints.some((p) => p.y !== null) ||
    netIncomePoints.some((p) => p.y !== null) ||
    ebitPoints.some((p) => p.y !== null) ||
    assetsPoints.some((p) => p.y !== null) ||
    equityAbsPoints.some((p) => p.y !== null) ||
    scorePoints.some((p) => p.y !== null) ||
    marginPoints.some((p) => p.y !== null) ||
    roaPoints.some((p) => p.y !== null) ||
    roePoints.some((p) => p.y !== null) ||
    debtPoints.some((p) => p.y !== null) ||
    equityRatioPoints.some((p) => p.y !== null) ||
    liquidityPoints.some((p) => p.y !== null);

  if (error) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Grafy</h2>
        <div className="mt-2 text-sm text-zinc-600">Grafy sa nepodarilo načítať.</div>
        <pre className="mt-3 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          {error}
        </pre>
      </section>
    );
  }

  if (!hasAnyData) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Grafy</h2>
        <div className="mt-2 text-sm text-zinc-600">Nie sú dostupné dáta pre grafy.</div>
      </section>
    );
  }

  // Percent ratios are stored as 0..1, so scale axis by 0.01 => show 0.18 as 18 (%)
  const pctAxisDiv = 0.01;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="text-sm font-semibold">Grafy (vývoj v čase)</h2>
        <div className="text-xs text-zinc-500">norm_period = 1</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* --- ABSOLUTE EUR charts (axis auto-scales in SimpleLineChart; tooltip shows €) --- */}
        <SimpleLineChart
          title="Tržby"
          subtitle="Ročné tržby (EUR)"
          points={revenuePoints}
          autoUnit="eur"
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
        />

        <SimpleLineChart
          title="Čistý zisk"
          subtitle="Net income (EUR)"
          points={netIncomePoints}
          autoUnit="eur"
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
        />

        <SimpleLineChart
          title="EBIT"
          subtitle="Prevádzkový zisk (EUR)"
          points={ebitPoints}
          autoUnit="eur"
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
        />

        <SimpleLineChart
          title="Aktíva"
          subtitle="Total assets (EUR)"
          points={assetsPoints}
          autoUnit="eur"
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
        />

        <SimpleLineChart
          title="Vlastné imanie"
          subtitle="Equity (EUR)"
          points={equityAbsPoints}
          autoUnit="eur"
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
        />

        {/* --- Score (unitless) --- */}
        <SimpleLineChart
          title="Skóre"
          subtitle="Finálne hodnotenie v čase"
          points={scorePoints}
          yScaleDivisor={1}
          ySuffix=""
          yFractionDigits={0}
          tooltipValueFormatter={(raw) => `${Math.round(raw)}`}
        />

        {/* --- Percent ratios (0..1) => show % on axis + tooltip --- */}
        <SimpleLineChart
          title="Čistá marža"
          subtitle="Zisk / tržby"
          points={marginPoints}
          yScaleDivisor={pctAxisDiv}
          ySuffix=" %"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />

        <SimpleLineChart
          title="ROA"
          subtitle="Zisk / aktíva"
          points={roaPoints}
          yScaleDivisor={pctAxisDiv}
          ySuffix=" %"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />

        <SimpleLineChart
          title="ROE"
          subtitle="Zisk / vlastné imanie"
          points={roePoints}
          yScaleDivisor={pctAxisDiv}
          ySuffix=" %"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />

        <SimpleLineChart
          title="Zadlženosť (Debt ratio)"
          subtitle="Záväzky / aktíva"
          points={debtPoints}
          yScaleDivisor={pctAxisDiv}
          ySuffix=" %"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />

        <SimpleLineChart
          title="Podiel vlastného imania (Equity ratio)"
          subtitle="Vlastné imanie / aktíva"
          points={equityRatioPoints}
          yScaleDivisor={pctAxisDiv}
          ySuffix=" %"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />

        {/* --- Liquidity ratio (unitless, not %): keep as plain number --- */}
        <SimpleLineChart
          title="Bežná likvidita (Current ratio)"
          subtitle="Obežné aktíva / krátkodobé záväzky"
          points={liquidityPoints}
          yScaleDivisor={1}
          ySuffix=""
          yFractionDigits={2}
          tooltipValueFormatter={(raw) => formatNumberSK(raw, 2)}
        />
      </div>
    </section>
  );
}