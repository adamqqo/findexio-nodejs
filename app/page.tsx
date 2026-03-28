import SearchBox from '@/components/SearchBox';
import TopCompaniesClient from '@/components/TopCompaniesClient';
import { getProcessedDataStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stats = await getProcessedDataStats();

  const processedStatements = new Intl.NumberFormat('sk-SK').format(stats.processed_statements);
  const processedCompanies = new Intl.NumberFormat('sk-SK').format(stats.processed_companies);

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="panel-strong overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-200">
              Modern Financial Intelligence
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
              Findexio radar pre finančné zdravie slovenských firiem.
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/90 sm:text-base">
              Vyhľadávaj podľa IČO alebo názvu, sleduj riziko defaultu a benchmarkuj firmy cez účtovné dáta z verejných registrov.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/15 bg-slate-900/50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300/70">Spracované výkazy</div>
              <div className="mt-2 text-3xl font-semibold text-white">{processedStatements}</div>
            </div>
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Unikátne firmy</div>
              <div className="mt-2 text-3xl font-semibold text-cyan-100">{processedCompanies}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="vyhladavanie" className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Vyhľadaj firmu okamžite</h2>
          <p className="mt-1 text-sm text-slate-300/80">Reálny lookup cez názov alebo IČO + okamžité hodnotenie.</p>
        </div>
        <SearchBox />
      </section>

      <section id="top-firmy" className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Rebríček lídrov</h2>
          <p className="mt-1 text-sm text-slate-300/80">Výber top firiem podľa známky, skóre a konzistencie výsledkov.</p>
        </div>
        <TopCompaniesClient />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Transparentnosť</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Open data základ</h3>
          <p className="mt-2 text-sm text-slate-300/80">Postavené na verejne dostupných dátach z RPO, RUZ a Slovensko.Digital.</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Risk-first</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Default signal v praxi</h3>
          <p className="mt-2 text-sm text-slate-300/80">Vizualizácia trendu rizika a kľúčových finančných indikátorov na jednom mieste.</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Benchmark</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Porovnanie s trhom</h3>
          <p className="mt-2 text-sm text-slate-300/80">Rýchly kontext voči peer skupine pre lepšie rozhodovanie investorov aj analytikov.</p>
        </article>
      </section>
    </div>
  );
}
