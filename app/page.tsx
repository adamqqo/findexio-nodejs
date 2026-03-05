import SearchBox from '@/components/SearchBox';
import TopCompaniesClient from '@/components/TopCompaniesClient';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Findexio</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Vyhľadávanie a hodnotenie firiem na základe účtovných závierok. Zdrojom sú verejne dostupné dáta z Registra právnických osôb, Registra účtovných závierok a platformy Slovensko.Digital.
        </p>
      </section>

      <SearchBox />

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
