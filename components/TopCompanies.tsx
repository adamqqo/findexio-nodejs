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
    <section className="fx-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ukážka</div>
          <h3 className="mt-1 text-xl font-semibold text-[#1d2d49]">Top firmy podľa známky (2024)</h3>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Výber z 25% najväčších firiem (tržby + majetok), zoradený podľa známky, Kralicek Quick-Test skóre a veľkosti firmy.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80">
        <ul className="divide-y divide-slate-200/80">
          {items.map((r, idx) => (
            <li key={r.ico} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#217d82]">#{idx + 1}</div>
                  <div className="text-sm font-semibold text-[#1d2d49]">
                    <Link className="no-underline hover:underline" href={`/company/${encodeURIComponent(r.ico)}`}>
                      {r.name ?? '(bez názvu)'}
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">IČO:</span> {r.ico}
                    {r.legal_form_name ? <span> • {r.legal_form_name}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-slate-500">
                    <div className="font-medium text-slate-700">{r.fiscal_year ?? '—'}</div>
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
