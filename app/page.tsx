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
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Findexio</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Vyhľadávanie a hodnotenie firiem na základe účtovných závierok. Zdrojom sú verejne dostupné dáta z Registra právnických osôb, Registra účtovných závierok a platformy Slovensko.Digital.
        </p>
      </section>

      <SearchBox />

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-medium text-zinc-500">Databázové štatistiky</div>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900">
          Spracované údaje
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Spracované účtovné výkazy</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-900">
              {processedStatements}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Unikátne firmy (IČO)</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-900">
              {processedCompanies}
            </div>
          </div>
        </div>
      </section>

      <TopCompaniesClient />

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-medium text-zinc-500">Poznámka</div>
        <p className="mt-2 text-sm text-zinc-600">
          Aplikácia je vo vývoji a môže obsahovať chyby či neúplné dáta.
        </p>
      </section>
    </div>
  );
}
