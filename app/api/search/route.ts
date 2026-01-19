import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isMostlyNumeric(s: string) {
  return /^[0-9]+$/.test(s);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('query') ?? '').trim();

  if (query.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const pool = getPool();

  const numeric = isMostlyNumeric(query);
  const icoLike = numeric ? `${query}%` : '0';
  const nameLike = `%${query}%`;

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
      WHERE gg.ico = o.ico AND gg.norm_period = 1 AND gg.fiscal_year = g.fiscal_year
      LIMIT 1
    ) AS hscore ON TRUE
    WHERE (${numeric ? 'o.ico LIKE $1' : 'FALSE'}) OR (o.name ILIKE $2)
    ORDER BY o.name
    LIMIT 25
  `;

  const res = await pool.query(sql, [icoLike, nameLike]);
  return NextResponse.json({ items: res.rows });
}
