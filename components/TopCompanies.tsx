import Link from 'next/link';
import GradeBadge from './GradeBadge';

export type TopCompanyRow = {
  ico: string;
  name: string | null;
  legal_form_name: string | null;
  fiscal_year: number | null;
  grade: string | null;
  score_total: number | null;

  // optional (API ich môže posielať, UI ich zatiaľ nemusí zobrazovať)
  current_ratio?: number | null;
  debt_ratio?: number | null;
  roa?: number | null;
  roe?: number | null;
  net_margin?: number | null;
  flags_count?: number | null;
};

type Props = { items: TopCompanyRow[] };

export default function TopCompanies({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className="glass-panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Market leaders</div>
          <h2 className="mt-1 text-xl font-semibold text-white">Top firmy podľa známky (2024)</h2>
          <p className="mt-1 max-w-4xl text-sm text-slate-300">
            Výber z 25 % najväčších spoločností (tržby + majetok), zoradené podľa známky, Kralicek Quick-Test skóre a veľkosti firmy.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <ul className="divide-y divide-white/10">
          {items.map((r) => (
            <li key={r.ico} className="p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    <Link className="no-underline hover:underline" href={`/company/${encodeURIComponent(r.ico)}`}>
                      {r.name ?? '(bez názvu)'}
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    <span className="font-medium text-slate-200">IČO:</span> {r.ico}
                    {r.legal_form_name ? <span> • {r.legal_form_name}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-slate-400">
                    <div className="font-medium text-slate-200">{r.fiscal_year ?? '—'}</div>
                    <div>score {r.score_total ?? '—'}</div>
                  </div>
                  <GradeBadge grade={r.grade} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
