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
  roa: number | null;
  roe: number | null;
  net_margin: number | null;
};

type PdRow = {
  fiscal_year: number;
  pd_12m: number;
  pd_pct: number | null;
};

type AggregateRow = {
  fiscal_year: number;
  revenue: number | null;
  net_income: number | null;
  ebit: number | null;
  total_assets: number | null;
  equity: number | null;
  interest_expense: number | null;
};

export default function CompanyCharts({ ico }: { ico: string }) {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [features, setFeatures] = useState<FeatureSeriesRow[]>([]);
  const [aggregates, setAggregates] = useState<AggregateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pdSeries, setPdSeries] = useState<PdRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        const res = await fetch(`/api/company/${encodeURIComponent(ico)}/timeseries`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (cancelled) return;

        setGrades((data.grades ?? []) as GradeRow[]);
        setFeatures((data.featuresSeries ?? []) as FeatureSeriesRow[]);
        setAggregates((data.aggregates ?? []) as AggregateRow[]);
        setPdSeries((data.pdSeries ?? []) as PdRow[]);

      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ico]);

  const scorePoints = useMemo(
    () => grades.map((g) => ({ x: g.fiscal_year, y: g.score_total ?? null })),
    [grades]
  );

  const roaPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.roa ?? null })),
    [features]
  );

  const marginPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.net_margin ?? null })),
    [features]
  );

  const debtPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.debt_ratio ?? null })),
    [features]
  );

  const liquidityPoints = useMemo(
    () => features.map((f) => ({ x: f.fiscal_year, y: f.current_ratio ?? null })),
    [features]
  );

  const revenuePoints = useMemo(
  () => aggregates.map(a => ({ x: a.fiscal_year, y: a.revenue })),
  [aggregates]
  );

    const netIncomePoints = useMemo(
  () => aggregates.map(a => ({ x: a.fiscal_year, y: a.net_income })),
  [aggregates]
  );

    const ebitPoints = useMemo(
  () => aggregates.map(a => ({ x: a.fiscal_year, y: a.ebit })),
  [aggregates]
  );

    const assetsPoints = useMemo(
  () => aggregates.map(a => ({ x: a.fiscal_year, y: a.total_assets })),
  [aggregates]
  );

    const equityPoints = useMemo(
  () => aggregates.map(a => ({ x: a.fiscal_year, y: a.equity })),
  [aggregates]
  );

    const pdPoints = useMemo(
      () => pdSeries.map(p => ({ x: p.fiscal_year, y: p.pd_12m })),
      [pdSeries]
    );


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

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="text-sm font-semibold">Grafy (vývoj v čase)</h2>
        <div className="text-xs text-zinc-500">norm_period = 1</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleLineChart
            title="Tržby"
            subtitle="Ročné tržby (EUR)"
            points={revenuePoints}
            yScaleDivisor={1_000_000}
              ySuffix=" mil. €"
              yFractionDigits={1}
              tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
            />

        <SimpleLineChart
          title="Čistý zisk"
          subtitle="Net income (EUR)"
          points={netIncomePoints}
            yScaleDivisor={1_000_000}
              ySuffix=" mil. €"
              yFractionDigits={1}
              tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
            />

        <SimpleLineChart
          title="EBIT"
          subtitle="Prevádzkový zisk (EUR)"
          points={ebitPoints}
            yScaleDivisor={1_000_000}
              ySuffix=" mil. €"
              yFractionDigits={1}
              tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
            />

        <SimpleLineChart
          title="Majetok vs. vlastné imanie"
          subtitle="Aktíva a equity (EUR)"
          points={assetsPoints}
            yScaleDivisor={1_000_000}
              ySuffix=" mil. €"
              yFractionDigits={1}
              tooltipValueFormatter={(raw) => `${formatNumberSK(raw, 0)} €`}
            />

          <SimpleLineChart
              title="Skóre"
              subtitle="Finálne hodnotenie v čase"
              points={scorePoints}
              yScaleDivisor={1}
              ySuffix=""
              yFractionDigits={0}
              tooltipValueFormatter={(raw) => `${Math.round(raw)}`}
            />

        <SimpleLineChart
          title="Čistá marža (proxy pre ziskovosť)"
          subtitle="Zisk / tržby"
          points={marginPoints}
          yScaleDivisor={1}
          ySuffix="%"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />
        <SimpleLineChart
          title="ROA"
          subtitle="Zisk / aktíva"
          points={roaPoints}
          yScaleDivisor={1}
          ySuffix="%"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />
        <SimpleLineChart
          title="Zadlženosť (Debt ratio)"
          subtitle="Záväzky / aktíva"
          points={debtPoints}
          yScaleDivisor={1}
          ySuffix="%"
          yFractionDigits={1}
          tooltipValueFormatter={(raw) => `${formatNumberSK(raw * 100, 2)} %`}
        />
        <SimpleLineChart
          title="Bežná likvidita (Current ratio)"
          subtitle="Obežné aktíva / krátkodobé záväzky"
          points={liquidityPoints}
          yScaleDivisor={1}
          ySuffix=""
          yFractionDigits={2}
        />
      </div>
    </section>
  );
}
