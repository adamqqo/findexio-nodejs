// app/api/top-companies/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = getPool();

    const sql = `
      WITH grade_2024 AS (
        SELECT
          g.ico,
          g.fiscal_year,
          g.grade,
          g.score_total
        FROM core.fin_health_grade g
        WHERE g.norm_period = 1
          AND g.fiscal_year = 2024
      ),
      feat_2024 AS (
  SELECT *
  FROM (
    SELECT
      f.ico,
      f.fiscal_year,
      f.current_ratio,
      f.debt_ratio,
      f.roa,
      f.roe,
      f.net_margin,
      COALESCE(f.negative_equity_flag, false) AS negative_equity_flag,
      COALESCE(f.liquidity_breach_flag, false) AS liquidity_breach_flag,
      COALESCE(f.high_leverage_flag, false) AS high_leverage_flag,
      COALESCE(f.loss_flag, false) AS loss_flag,
      ROW_NUMBER() OVER (
        PARTITION BY f.ico, f.fiscal_year
        ORDER BY f.period_end DESC NULLS LAST, f.report_id DESC
      ) AS rn
    FROM core.fin_annual_features f
    WHERE f.norm_period = 1
      AND f.fiscal_year = 2024
  ) x
  WHERE x.rn = 1
)

      SELECT
        o.ico,
        o.name,
        o.legal_form_name,
        g.fiscal_year,
        g.grade,
        g.score_total,
        f.current_ratio,
        f.debt_ratio,
        f.roa,
        f.roe,
        f.net_margin,
        (f.negative_equity_flag::int
         + f.liquidity_breach_flag::int
         + f.high_leverage_flag::int
         + f.loss_flag::int) AS flags_count
      FROM grade_2024 g
      JOIN core.rpo_all_orgs o ON o.ico = g.ico
      LEFT JOIN feat_2024 f ON f.ico = g.ico AND f.fiscal_year = g.fiscal_year
      WHERE o.legal_form_code IN ('112','121')
        AND g.grade IS NOT NULL
      ORDER BY
        CASE g.grade
          WHEN 'A' THEN 1
          WHEN 'B' THEN 2
          WHEN 'C' THEN 3
          WHEN 'D' THEN 4
          WHEN 'E' THEN 5
          WHEN 'F' THEN 6
          ELSE 99
        END,
        g.score_total DESC NULLS LAST,
        flags_count ASC,
        f.roa DESC NULLS LAST,
        f.roe DESC NULLS LAST,
        f.net_margin DESC NULLS LAST,
        f.current_ratio DESC NULLS LAST,
        f.debt_ratio ASC NULLS LAST,
        o.name ASC
      LIMIT 10;
    `;

    const res = await pool.query(sql);
    return NextResponse.json({ items: res.rows ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
