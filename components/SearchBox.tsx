'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import GradeBadge from './GradeBadge';

type SearchResult = {
  ico: string;
  name: string | null;
  legal_form_name: string | null;
  status: string | null;
  address: string | null;
  fiscal_year: number | null;
  grade: string | null;
  score_total: number | null;
  min_year: number | null;
  max_year: number | null;
  years_count: number | null;
  last_grades: (string | null)[] | null;
};

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebouncedValue(query.trim(), 250);

  const canSearch = useMemo(() => debounced.length >= 2, [debounced]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!canSearch) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(debounced)}`, {
          cache: 'no-store'
        });
        const data = (await res.json()) as { items: SearchResult[] };
        if (!cancelled) setResults(data.items ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [debounced, canSearch]);

  return (
    <div className="w-full">
      <div className="fx-card p-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Názov firmy alebo IČO</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="napr. 12345678 alebo ACME"
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-inner outline-none transition focus:border-[#217d82] focus:ring-4 focus:ring-[#217d82]/15"
        />
        <div className="mt-3 text-xs text-slate-500">
          {loading ? 'Vyhľadávam…' : canSearch ? `${results.length} výsledkov` : 'Zadajte aspoň 2 znaky.'}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="fx-card mt-4 overflow-hidden">
          <ul className="divide-y divide-slate-200/80">
            {results.map((r) => (
              <li key={r.ico} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#1d2d49]">
                      <Link className="no-underline hover:underline" href={`/company/${encodeURIComponent((r.ico ?? '').trim())}`}>
                        {r.name ?? '(bez názvu)'}
                      </Link>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">IČO:</span> {r.ico}
                      {r.legal_form_name ? <span> • {r.legal_form_name}</span> : null}
                      {r.status ? <span> • {r.status}</span> : null}
                    </div>
                    {r.min_year && r.max_year ? (
                      <div className="mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Vývoj:</span> {r.min_year}–{r.max_year}
                        {r.years_count ? <span> ({r.years_count} období)</span> : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-slate-500">
                      <div className="font-medium text-slate-700">{r.fiscal_year ?? '—'}</div>
                      <div>score {r.score_total ?? '—'}</div>
                    </div>
                    <GradeBadge grade={r.grade} />
                  </div>
                </div>

                {r.last_grades && r.last_grades.length ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="text-xs text-slate-500">Posledné roky:</div>
                    {r.last_grades
                      .filter((g) => g !== null)
                      .slice(0, 5)
                      .map((g, idx) => (
                        <div key={`${r.ico}-g-${idx}`}>
                          <GradeBadge grade={g} />
                        </div>
                      ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
