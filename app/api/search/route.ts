import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

let _hasUnaccent: boolean | null = null;

async function hasUnaccent() {
  if (_hasUnaccent !== null) return _hasUnaccent;
  try {
    const pool = getPool();
    const r = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unaccent') AS ok;"
    );
    _hasUnaccent = Boolean(r.rows?.[0]?.ok);
  } catch {
    _hasUnaccent = false;
  }
  return _hasUnaccent;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = (searchParams.get('query') ?? '').trim();

  if (rawQuery.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const pool = getPool();

  // digitsOnly použijeme len pre IČO prefix; keď je krátke/žiadne, ICO filter sa vypne
  const digitsOnly = rawQuery.replace(/\D/g, '');
  const icoLike = digitsOnly.length >= 3 ? `${digitsOnly}%` : ''; // <-- kľúčová oprava
  const nameLike = `%${rawQuery.replace(/\s+/g, '%')}%`;

  const useUnaccent = await hasUnaccent();
  const namePredicate = useUnaccent
    ? 'unaccent(o.name) ILIKE unaccent($2)'
    : 'o.name ILIKE $2';

  const sql = `
    WITH grade_stats AS (
      SELECT
        ico,
        MIN(fiscal_year) AS min_year,
        MAX(fiscal_year) AS max_year,
        COUNT(*)::int AS years_count,
        (ARRAY_AGG(grade ORDER BY fiscal_year DESC))[1:5] AS last_grades
      FROM core.fin_health_grade
      WHERE norm_period = 1
      GROUP BY ico
    ),
    latest_grade AS (
      SELECT ico, max_year AS fiscal_year, last_grades[1] AS grade
      FROM grade_stats
    )
    SELECT
      o.ico,
      o.name,
      o.legal_form_name,
      o.status,
      o.address,
      g.fiscal_year,
      g.grade,
      hscore.score_total,
      h.min_year,
      h.max_year,
      h.years_count,
      h.last_grades
    FROM core.rpo_all_orgs o
    LEFT JOIN latest_grade g ON g.ico = o.ico
    LEFT JOIN grade_stats h ON h.ico = o.ico
    LEFT JOIN LATERAL (
      SELECT score_total
      FROM core.fin_health_grade gg
      WHERE gg.ico = o.ico
        AND gg.norm_period = 1
        AND gg.fiscal_year = g.fiscal_year
      LIMIT 1
    ) AS hscore ON TRUE
    WHERE
      (($1 <> '') AND o.ico LIKE $1)
      OR (${namePredicate})
    ORDER BY o.name
    LIMIT 25;
  `;

  const res = await pool.query(sql, [icoLike, nameLike]);
  return NextResponse.json({ items: res.rows });
}
