import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = getPool();

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
          legal_form_name
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
    return NextResponse.json({ items: res.rows ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
