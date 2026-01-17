import { getPool } from './db';

export type CompanyIdentity = {
  ico: string;
  name: string | null;
  legal_form_name: string | null;
  status: string | null;
  address: string | null;
};

export type GradeRow = {
  fiscal_year: number;
  period_end: string | null;
  grade: string | null;
  score_total: number | null;
  reason: string | null;
};

export type FeatureRow = {
  fiscal_year: number;
  period_end: string | null;
  current_ratio: number | null;
  quick_ratio: number | null;
  cash_ratio: number | null;
  equity_ratio: number | null;
  debt_ratio: number | null;
  debt_to_equity: number | null;
  roa: number | null;
  roe: number | null;
  net_margin: number | null;
  asset_turnover: number | null;
  interest_coverage: number | null;
  negative_equity_flag: boolean | null;
  liquidity_breach_flag: boolean | null;
  high_leverage_flag: boolean | null;
  loss_flag: boolean | null;
};

export async function getCompanyIdentity(ico: string): Promise<CompanyIdentity | null> {
  const pool = getPool();
  const res = await pool.query(
    `
    SELECT ico, name, legal_form_name, status, address
    FROM core.rpo_all_orgs
    WHERE ico = $1
    LIMIT 1
    `,
    [ico]
  );
  return res.rows[0] ?? null;
}

export async function getCompanyGrades(ico: string): Promise<GradeRow[]> {
  const pool = getPool();
  const res = await pool.query(
    `
    SELECT fiscal_year, period_end::text AS period_end, grade, score_total, reason
    FROM core.fin_health_grade
    WHERE ico = $1 AND norm_period = 1
    ORDER BY fiscal_year ASC
    `,
    [ico]
  );
  return res.rows;
}

export async function getCompanyLatestFeatures(ico: string): Promise<FeatureRow | null> {
  const pool = getPool();
  const res = await pool.query(
    `
    SELECT
      fiscal_year,
      period_end::text AS period_end,
      current_ratio,
      quick_ratio,
      cash_ratio,
      equity_ratio,
      debt_ratio,
      debt_to_equity,
      roa,
      roe,
      net_margin,
      asset_turnover,
      interest_coverage,
      negative_equity_flag,
      liquidity_breach_flag,
      high_leverage_flag,
      loss_flag
    FROM core.fin_annual_features
    WHERE ico = $1 AND norm_period = 1
    ORDER BY fiscal_year DESC
    LIMIT 1
    `,
    [ico]
  );
  return res.rows[0] ?? null;
}
