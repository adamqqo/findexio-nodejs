'use client';

import { useEffect, useMemo, useState } from 'react';

type BenchmarkMetricRow = {
  metric: string;
  company_value: number | null;
  median_value: number | null;
  p25_value: number | null;
  p75_value: number | null;
  percentile: number | null;
  n: number;
};

type CompanyBenchmarkResult = {
  context: {
    ico: string;
    fiscal_year: number;
    nace_division: string | null;
    main_activity_code_id: string | null;
    main_activity_code_name: string | null;
    kraj: string | null;
    okres: string | null;
  };
  benchmark: {
    geo_level: 'country' | 'kraj' | 'okres';
    geo_value: string;
    sector_level: 'nace_division' | 'main_activity_code_id';
    sector_value: string;
    sector_label: string | null;
    n: number;
  };
  metrics: BenchmarkMetricRow[];
};

function formatNumberSK(value: number, digits = 2) {
  return new Intl.NumberFormat('sk-SK', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(value);
}

function fmtRatio(x: number | null) {
  if (x === null || x === undefined) return '—';
  return formatNumberSK(x, 2);
}

function fmtPct(x: number | null) {
  if (x === null || x === undefined) return '—';
  return `${formatNumberSK(x * 100, 1)} %`;
}

function fmtPercentile(x: number | null) {
  if (x === null || x === undefined) return '—';
  return `${Math.round(x * 100)}. pctl`;
}

function metricLabel(metric: string) {
  switch (metric) {
    case 'current_ratio':
      return 'Celková likvidita';
    case 'equity_ratio':
      return 'Podiel vlastného imania';
    case 'debt_ratio':
      return 'Zadlženosť';
    case 'roa':
      return 'ROA';
    case 'roe':
      return 'ROE';
    case 'net_margin':
      return 'Čistá marža';
    case 'score_total':
      return 'Skóre';
    case 'pd_pct':
      return 'ML rizikový percentil';
    default:
      return metric;
  }
}

function isPercentMetric(metric: string) {
  return ['equity_ratio', 'debt_ratio', 'roa', 'roe', 'net_margin', 'pd_pct'].includes(metric);
}

function formatMetric(metric: string, value: number | null) {
  if (metric === 'score_total') {
    if (value === null || value === undefined) return '—';
    return formatNumberSK(value, 0);
  }

  if (isPercentMetric(metric)) return fmtPct(value);
  return fmtRatio(value);
}

export default function CompanyBenchmark({ ico }: { ico: string }) {
  const [data, setData] = useState<CompanyBenchmarkResult | null>(null);
  const [geo, setGeo] = useState<'kraj' | 'country'>('kraj');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/company/${encodeURIComponent(ico)}/benchmark?geo=${geo}&sector=nace_division`,
          { cache: 'no-store' }
        );

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const json = (await res.json()) as CompanyBenchmarkResult;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) {
          setData(null);
          setError(String(e?.message ?? e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ico, geo]);

  const rows = useMemo(() => data?.metrics ?? [], [data]);

  if (loading) {
    return <div className="text-sm text-zinc-600">Načítavam sektorové porovnanie…</div>;
  }

  if (error || !data) {
    return (
      <div className="text-sm text-zinc-600">
        Sektorové porovnanie zatiaľ nie je dostupné.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-600">
          Benchmark skupina:{' '}
          <span className="font-medium text-zinc-800">
            {data.benchmark.geo_value} • {data.benchmark.sector_label ?? data.benchmark.sector_value}
          </span>
          <span className="ml-2 text-zinc-500">(n = {data.benchmark.n})</span>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setGeo('kraj')}
            className={`rounded-full border px-3 py-1 ${
              geo === 'kraj'
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-700'
            }`}
          >
            Kraj
          </button>
          <button
            type="button"
            onClick={() => setGeo('country')}
            className={`rounded-full border px-3 py-1 ${
              geo === 'country'
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-700'
            }`}
          >
            Slovensko
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="py-2 pr-4">Metrika</th>
              <th className="py-2 pr-4">Firma</th>
              <th className="py-2 pr-4">Medián</th>
              <th className="py-2 pr-4">IQR</th>
              <th className="py-2 pr-4">Percentil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {rows.map((r) => (
              <tr key={r.metric}>
                <td className="py-2 pr-4 font-medium text-zinc-800">{metricLabel(r.metric)}</td>
                <td className="py-2 pr-4">{formatMetric(r.metric, r.company_value)}</td>
                <td className="py-2 pr-4">{formatMetric(r.metric, r.median_value)}</td>
                <td className="py-2 pr-4">
                  {formatMetric(r.metric, r.p25_value)} – {formatMetric(r.metric, r.p75_value)}
                </td>
                <td className="py-2 pr-4">{fmtPercentile(r.percentile)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] leading-relaxed text-zinc-500">
        Percentil vyjadruje relatívne poradie firmy v benchmark skupine. Medián je typická hodnota skupiny,
        IQR zobrazuje stredných 50 % firiem.
      </div>
    </div>
  );
}