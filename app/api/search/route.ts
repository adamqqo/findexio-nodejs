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
    WITH latest_grade AS (
      SELECT DISTINCT ON (ico) ico, fiscal_year, grade, score_total
      FROM core.fin_health_grade
      WHERE norm_period = 1
      ORDER BY ico, fiscal_year DESC
    )
    SELECT
      o.ico,
      o.name,
      o.legal_form_name,
      o.status,
      o.address,
      g.fiscal_year,
      g.grade,
      g.score_total
    FROM core.rpo_all_orgs o
    LEFT JOIN latest_grade g ON g.ico = o.ico
    WHERE (${numeric ? 'o.ico LIKE $1' : 'FALSE'}) OR (o.name ILIKE $2)
    ORDER BY o.name
    LIMIT 25
  `;

  const res = await pool.query(sql, [icoLike, nameLike]);
  return NextResponse.json({ items: res.rows });
}
