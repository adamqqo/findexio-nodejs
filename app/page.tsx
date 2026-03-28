import SearchBox from '@/components/SearchBox';
import TopCompaniesClient from '@/components/TopCompaniesClient';
import { getProcessedDataStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stats = await getProcessedDataStats();

  const processedStatements = new Intl.NumberFormat('sk-SK').format(
    stats.processed_statements
  );
  const processedCompanies = new Intl.NumberFormat('sk-SK').format(
    stats.processed_companies
  );

  return (
    <div className="space-y-8">
      <section className="fx-card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#217d82]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#f5be42]/25 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="space-y-4">
            <div className="fx-pill">Financial intelligence platform</div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#1d2d49] md:text-5xl">
              Moderný kreditný radar pre slovenské firmy
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 md:text-base">
              Vyhľadávanie, benchmarky a scorecardy z účtovných výkazov na jednom mieste. Údaje čerpáme z verejných registrov (RPO, RUZ, Slovensko.Digital) a prepájame ich do jasného, rýchleho pohľadu na riziko a výkonnosť.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-[#1d2d49]/10 bg-white/85 p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Spracované výkazy</div>
              <div className="mt-2 text-3xl font-semibold text-[#1d2d49]">{processedStatements}</div>
            </div>
            <div className="rounded-2xl border border-[#217d82]/20 bg-[#217d82]/5 p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Unikátne firmy (IČO)</div>
              <div className="mt-2 text-3xl font-semibold text-[#1d2d49]">{processedCompanies}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-[#1d2d49]">Instantné vyhľadávanie</h2>
          <div className="fx-pill hidden sm:inline-flex">Live search</div>
        </div>
        <SearchBox />
      </section>

      <section id="top-firmy" className="space-y-3 scroll-mt-24">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-[#1d2d49]">Rebríček výkonných spoločností</h2>
          <div className="fx-pill hidden sm:inline-flex">Top performers</div>
        </div>
        <TopCompaniesClient />
      </section>

      <section className="fx-card p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Poznámka k dátam</div>
        <p className="mt-2 text-sm text-slate-600">
          Aplikácia je vo vývoji, preto sa pri jednotlivých firmách môžu vyskytnúť neúplné alebo oneskorene aktualizované dáta.
        </p>
      </section>
    </div>
  );
}
