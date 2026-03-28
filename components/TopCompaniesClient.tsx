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
      <section className="glass-panel p-5 sm:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Market movers</div>
        <div className="mt-2 text-sm text-slate-300">Načítavam top firmy…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="glass-panel p-5 sm:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Market movers</div>
        <div className="mt-2 text-sm text-slate-300">Top firmy sa nepodarilo načítať.</div>
        <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
          {error}
        </pre>
      </section>
    );
  }

  return <TopCompanies items={items} />;
}
