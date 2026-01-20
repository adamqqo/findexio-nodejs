import SearchBox from '@/components/SearchBox';
import TopCompanies, { type TopCompanyRow } from '@/components/TopCompanies';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const pool = getPool();

  let top: TopCompanyRow[] = [];
  try {
    const sql = `
      WITH latest AS (
        SELECT DISTINCT ON (lpad(regexp_replace(ico, '\\D', '', 'g'), 8, '0'))
          lpad(regexp_replace(ico, '\\D', '', 'g'), 8, '0') AS ico8,
          fiscal_year,
          grade,
          score_total
        FROM core.fin_health_grade
        WHERE norm_period = 1
        ORDER BY lpad(regexp_replace(ico, '\\D', '', 'g'), 8, '0'), fiscal_year DESC
      ),
      orgs AS (
        SELECT
          lpad(regexp_replace(ico, '\\D', '', 'g'), 8, '0') AS ico8,
          ico,
          name,
          legal_form_code,
          legal_form_name,
          status,
          address
        FROM core.rpo_all_orgs
        WHERE legal_form_code IN ('112', '121')
      )
      SELECT
        o.ico,
        o.name,
        o.legal_form_name,
        l.fiscal_year,
        l.grade,
        l.score_total
      FROM latest l
      JOIN orgs o ON o.ico8 = l.ico8
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
      LIMIT 10;
    `;
    const res = await pool.query(sql);
    top = (res.rows ?? []) as TopCompanyRow[];
  } catch (e) {
    console.error('TopCompanies query failed:', e);
    top = [];
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Findexio</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Vyhľadávanie a hodnotenie firiem na základe účtovných závierok. Zdrojom sú výkazy z RÚZ.
        </p>
      </section>

      <TopCompanies items={top} />

      <SearchBox />

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-medium text-zinc-500">Poznámka</div>
        <p className="mt-2 text-sm text-zinc-600">
          Aplikácia je vo vývoji a môže obsahovať chyby či neúplné dáta.
        </p>
      </section>
    </div>
  );
}
