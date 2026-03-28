// components/TopCompanies.tsx
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
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-zinc-500">Ukážka</div>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900">
            Top firmy podľa známky (2024)
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Zobrazuje iba výber z 25% najväčších firiem (tržby+majetok). Zoradené podľa známky, skóre podľa Kralicek Quick-Test (KQT), veľkosti firmy.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
        <ul className="divide-y divide-zinc-200">
          {items.map((r) => (
            <li key={r.ico} className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    <Link className="no-underline hover:underline" href={`/company/${encodeURIComponent(r.ico)}`}>
                      {r.name ?? '(bez názvu)'}
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">IČO:</span> {r.ico}
                    {r.legal_form_name ? <span> • {r.legal_form_name}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-zinc-500">
                    <div className="font-medium text-zinc-700">{r.fiscal_year ?? '—'}</div>
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
