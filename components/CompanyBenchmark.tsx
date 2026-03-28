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

  leader_ico: string | null;
  leader_name: string | null;
  leader_value: number | null;
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
    geo_level: 'country' | 'kraj';
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

function isHigherBetter(metric: string) {
  return !['debt_ratio', 'pd_pct'].includes(metric);
}

function compareToMedianClass(metric: string, companyValue: number | null, medianValue: number | null) {
  if (companyValue === null || companyValue === undefined || medianValue === null || medianValue === undefined) {
    return 'text-slate-300';
  }

  if (companyValue === medianValue) return 'text-slate-300';

  const better = isHigherBetter(metric)
    ? companyValue > medianValue
    : companyValue < medianValue;

  return better ? 'text-emerald-300' : 'text-rose-300';
}

function compareToMedianBadge(metric: string, companyValue: number | null, medianValue: number | null) {
  if (companyValue === null || companyValue === undefined || medianValue === null || medianValue === undefined) {
    return '—';
  }

  if (companyValue === medianValue) return 'na mediáne';

  const better = isHigherBetter(metric)
    ? companyValue > medianValue
    : companyValue < medianValue;

  return better ? 'nad mediánom' : 'pod mediánom';
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
    return <div className="text-sm text-slate-300">Načítavam sektorové porovnanie…</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-slate-300">Sektorové porovnanie zatiaľ nie je dostupné.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-300">
          Benchmark skupina:{' '}
          <span className="font-medium text-slate-200">
            {data.benchmark.geo_value} • {data.benchmark.sector_label ?? data.benchmark.sector_value}
          </span>
          <span className="ml-2 text-slate-400">(n = {data.benchmark.n})</span>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setGeo('kraj')}
            className={`rounded-full border px-3 py-1 ${
              geo === 'kraj'
                ? 'border-[#51c7e9]/70 bg-[#51c7e9]/20 text-white'
                : 'border-white/10 bg-black/20 text-slate-300'
            }`}
          >
            Kraj
          </button>
          <button
            type="button"
            onClick={() => setGeo('country')}
            className={`rounded-full border px-3 py-1 ${
              geo === 'country'
                ? 'border-[#51c7e9]/70 bg-[#51c7e9]/20 text-white'
                : 'border-white/10 bg-black/20 text-slate-300'
            }`}
          >
            Slovensko
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400">
              <th className="py-2 pr-4">Metrika</th>
              <th className="py-2 pr-4">Firma</th>
              <th className="py-2 pr-4">Pozícia</th>
              <th className="py-2 pr-4">Medián</th>
              <th className="py-2 pr-4">IQR</th>
              <th className="py-2 pr-4">Percentil</th>
              <th className="py-2">Líder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((r) => {
              const cmpClass = compareToMedianClass(r.metric, r.company_value, r.median_value);
              const cmpBadge = compareToMedianBadge(r.metric, r.company_value, r.median_value);

              return (
                <tr key={r.metric}>
                  <td className="py-2 pr-4 font-medium text-slate-200">{metricLabel(r.metric)}</td>

                  <td className={`py-2 pr-4 font-medium ${cmpClass}`}>
                    {formatMetric(r.metric, r.company_value)}
                  </td>

                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        cmpClass === 'text-emerald-300'
                          ? 'bg-emerald-500/15 text-emerald-200'
                          : cmpClass === 'text-rose-300'
                          ? 'bg-rose-500/15 text-rose-200'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {cmpBadge}
                    </span>
                  </td>

                  <td className="py-2 pr-4">{formatMetric(r.metric, r.median_value)}</td>

                  <td className="py-2 pr-4">
                    {formatMetric(r.metric, r.p25_value)} – {formatMetric(r.metric, r.p75_value)}
                  </td>

                  <td className="py-2 pr-4">{fmtPercentile(r.percentile)}</td>

                  <td className="py-2">
                    {r.leader_name ? (
                      <div className="text-slate-300">
                        <div className="font-medium">{r.leader_name}</div>
                        <div className="text-xs text-slate-400">
                          {formatMetric(r.metric, r.leader_value)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] leading-relaxed text-slate-400">
        Zelená znamená priaznivejšiu pozíciu voči mediánu benchmark skupiny, červená slabšiu. Pri
        metrikách ako zadlženosť a rizikový percentil je nižšia hodnota lepšia.
      </div>
    </div>
  );
}