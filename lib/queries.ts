// noinspection SqlResolve
import { getPool } from './db';

function normalizeIco(input: string): string {
  return (input ?? '').toString().trim().replace(/[^0-9]/g, '');
}

function icoVariants(input: string): string[] {
  const base = normalizeIco(input);
  const out = new Set<string>();
  if (base) out.add(base);

  // Common variants:
  // - Some sources store IČO as 8 digits with leading zeros
  if (base.length > 0 && base.length < 8) out.add(base.padStart(8, '0'));
  // - Some sources trim leading zeros
  if (base.length === 8) out.add(base.replace(/^0+/, '') || '0');

  return Array.from(out);
}

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
  model_sk_pct: number | null;
};

export async function getCompanyIdentity(ico: string): Promise<CompanyIdentity | null> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return null;
  const res = await pool.query(
    `
    SELECT ico, name, legal_form_name, status, address
    FROM core.rpo_all_orgs
    WHERE ico = ANY($1::text[])
    LIMIT 1
    `,
    [variants]
  );
  return res.rows[0] ?? null;
}

export async function getCompanyGrades(ico: string): Promise<GradeRow[]> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return [];
  const res = await pool.query(
    `
    SELECT fiscal_year, period_end::text AS period_end, grade, score_total, reason
    FROM core.fin_health_grade
    WHERE ico = ANY($1::text[]) AND norm_period = 1
    ORDER BY fiscal_year ASC
    `,
    [variants]
  );
  return res.rows;
}

export async function getCompanyLatestFeatures(ico: string): Promise<FeatureRow | null> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return null;
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
      loss_flag,
      model_sk_pct
    FROM core.fin_annual_features
    WHERE ico = ANY($1::text[]) AND norm_period = 1
    ORDER BY fiscal_year DESC
    LIMIT 1
    `,
    [variants]
  );
  return res.rows[0] ?? null;
}

export type FeatureSeriesRow = {
  fiscal_year: number;
  period_end: string | null;
  current_ratio: number | null;
  debt_ratio: number | null;
  equity_ratio: number | null;
  roa: number | null;
  roe: number | null;
  net_margin: number | null;
};

export async function getCompanyFeatureSeries(ico: string): Promise<FeatureSeriesRow[]> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return [];

  const res = await pool.query(
    `
    SELECT
      fiscal_year,
      period_end::text AS period_end,
      current_ratio,
      debt_ratio,
      roa,
      equity_ratio,
      roe,
      net_margin
    FROM core.fin_annual_features
    WHERE ico = ANY($1::text[])
      AND norm_period = 1
    ORDER BY fiscal_year ASC
    `,
    [variants]
  );

  return res.rows;
}

export type AggregateSeriesRow = {
  fiscal_year: number;
  period_end: string | null;
  revenue: number | null;
  net_income: number | null;
  ebit: number | null;
  total_assets: number | null;
  equity: number | null;
  interest_expense: number | null;
};

export async function getCompanyAggregateSeries(
  ico: string
): Promise<AggregateSeriesRow[]> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return [];

  const res = await pool.query(
    `
    SELECT
      fiscal_year,
      period_end::text AS period_end,
      revenue,
      net_income,
      ebit,
      total_assets,
      equity,
      interest_expense
    FROM core.fin_annual_aggregates
    WHERE ico = ANY($1::text[])
      AND norm_period = 1
    ORDER BY fiscal_year ASC
    `,
    [variants]
  );

  return res.rows;
}

export type PdRow = {
  fiscal_year: number;
  pd_12m: number;
  pd_pct: number | null;
};

export async function getCompanyPdSeries(ico: string): Promise<PdRow[]> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return [];

  const res = await pool.query(
    `
    WITH latest_model AS (
      SELECT id
      FROM core.ml_model_registry
      ORDER BY created_at DESC
      LIMIT 1
    )
    SELECT p.fiscal_year, p.pd_12m, p.pd_pct
    FROM core.ml_pd_predictions p
    JOIN latest_model m ON m.id = p.model_id
    WHERE p.ico = ANY($1::text[])
    ORDER BY p.fiscal_year ASC
    `,
    [variants]
  );

  return res.rows;
}

export type BenchmarkContext = {
  ico: string;
  fiscal_year: number;
  nace_division: string | null;
  main_activity_code_id: string | null;
  main_activity_code_name: string | null;
  kraj: string | null;
  okres: string | null;
};

export type BenchmarkMetricRow = {
  metric: string;
  company_value: number | null;
  median_value: number | null;
  p25_value: number | null;
  p75_value: number | null;
  percentile: number | null;
  n: number;
};

export type CompanyBenchmarkResult = {
  context: BenchmarkContext;
  benchmark: {
    geo_level: 'country' | 'kraj' | 'okres';
    geo_value: string;
    sector_level: 'nace_division' | 'main_activity_code_id';
    sector_value: string;
    sector_label: string | null;
    n: number;
  };
  metrics: BenchmarkMetricRow[];
};

export async function getCompanyBenchmark(ico: string): Promise<BenchmarkContext | null> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return null;

  const res = await pool.query(
    `
    SELECT
      f.ico,
      f.fiscal_year,
      f.nace_division,
      f.main_activity_code_id,
      f.main_activity_code_name,
      f.kraj,
      f.okres
    FROM core.mv_company_benchmark_facts f
    WHERE f.ico = ANY($1::text[])
    ORDER BY f.fiscal_year DESC
    LIMIT 1
    `,
    [variants]
  );

  return res.rows[0] ?? null;
}