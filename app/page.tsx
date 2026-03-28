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
    <div className="space-y-8 sm:space-y-10">
      <section className="glass-panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#217d82]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-12 h-44 w-44 rounded-full bg-[#f5be42]/15 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-[#217d82]/50 bg-[#217d82]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#81d7ea]">
              Enterprise-grade risk screening
            </div>

            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
              Moderný finančný radar pre slovenské firmy.
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Vyhľadávanie, hodnotenie a benchmark finančného zdravia na základe účtovných závierok z verejných zdrojov (RPO, RÚZ a Slovensko.Digital).
            </p>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Spracované výkazy</div>
                <div className="mt-1 text-3xl font-semibold text-white">{processedStatements}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Unikátne firmy (IČO)</div>
                <div className="mt-1 text-3xl font-semibold text-white">{processedCompanies}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#1d2d49]/60 to-[#050b19] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[#7fd5e8]">Findexio score</div>
            <div className="mt-3 text-sm text-slate-300">
              Rýchla orientácia v riziku, likvidite a výkonnosti spoločností. Prirodzene pripravené pre analytikov, investorov aj B2B obchod.
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">• Priamy prechod na detail firmy podľa IČO</li>
              <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">• Rýchle porovnanie top spoločností</li>
              <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">• Kralicek Quick-Test + vývoj v čase</li>
            </ul>
          </div>
        </div>
      </section>

      <SearchBox />

      <TopCompaniesClient />

      <section className="glass-panel p-5 sm:p-6">
        <div className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">Poznámka</div>
        <p className="mt-2 text-sm text-slate-300">
          Aplikácia je vo vývoji a môže obsahovať neúplné alebo priebežne aktualizované dáta.
        </p>
      </section>
    </div>
  );
}
