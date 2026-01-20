import SearchBox from '@/components/SearchBox';
import TopCompanies, { type TopCompanyRow } from '@/components/TopCompanies';
import { getPool } from '@/lib/db';

export default async function HomePage() {
  const pool = getPool();

  let top: TopCompanyRow[] = [];
  try {
    const sql = `
      WITH latest AS (
        SELECT DISTINCT ON (ico)
          ico,
          fiscal_year,
          grade,
          score_total
        FROM core.fin_health_grade
        WHERE norm_period = 1
        ORDER BY ico, fiscal_year DESC
      )
      SELECT
        o.ico,
        o.name,
        o.legal_form_name,
        l.fiscal_year,
        l.grade,
        l.score_total
      FROM latest l
      JOIN core.rpo_all_orgs o ON o.ico = l.ico
      WHERE l.grade IS NOT NULL
      ORDER BY
        CASE l.grade
          WHEN 'A' THEN 1
          WHEN 'B' THEN 2
          WHEN 'C' THEN 3
          WHEN 'D' THEN 4
          WHEN 'E' THEN 5
          WHEN 'F' THEN 6
          ELSE 99
        END,
        l.score_total DESC NULLS LAST,
        o.name ASC
      LIMIT 10
    `;
    const res = await pool.query(sql);
    top = (res.rows ?? []) as TopCompanyRow[];
  } catch {
    // Non-blocking: homepage still renders with search.
    top = [];
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Findexio</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Vyhľadávanie a hodnotenie firiem na základe účtovných závierok. Zdrojom sú výkazy z RÚZ, prepočítané na agregáty, ratio a finálne skóre.
        </p>
      </section>

      <TopCompanies items={top} />

      <SearchBox />

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-medium text-zinc-500">Poznámka</div>
        <p className="mt-2 text-sm text-zinc-600">
          Frontend je read-only. Dáta sa plnia z backend ETL pipeline do PostgreSQL schémy <span className="font-mono">core.*</span>.
        </p>
      </section>
    </div>
  );
}
