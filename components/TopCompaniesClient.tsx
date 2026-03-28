'use client';

import { useEffect, useState } from 'react';
import TopCompanies, { type TopCompanyRow } from './TopCompanies';

export default function TopCompaniesClient() {
  const [items, setItems] = useState<TopCompanyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/top-companies', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { items: TopCompanyRow[] };
        if (!cancelled) setItems(data.items ?? []);
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message ?? e));
          setItems([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) {
    return (
      <section className="fx-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ukážka</div>
        <div className="mt-2 text-sm text-slate-600">Načítavam top firmy…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="fx-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ukážka</div>
        <div className="mt-2 text-sm text-slate-600">Top firmy sa nepodarilo načítať.</div>
        <pre className="mt-3 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {error}
        </pre>
      </section>
    );
  }

  return <TopCompanies items={items} />;
}
