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

export type ProcessedDataStats = {
  processed_statements: number;
  processed_companies: number;
};

export async function getProcessedDataStats(): Promise<ProcessedDataStats> {
  const pool = getPool();

  const res = await pool.query(
    `
    SELECT
      COUNT(*)::int AS processed_statements,
      COUNT(DISTINCT ico)::int AS processed_companies
    FROM core.fin_annual_features
    WHERE norm_period = 1
    `
  );

  return (
    res.rows[0] ?? {
      processed_statements: 0,
      processed_companies: 0
    }
  );
}

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
  nace_division_name: string | null;
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

  leader_ico: string | null;
  leader_name: string | null;
  leader_value: number | null;
};

export type CompanyBenchmarkResult = {
  context: BenchmarkContext;
  benchmark: {
    geo_level: 'country' | 'kraj';
    geo_value: string;
    sector_level: 'nace_division' | 'main_activity_code_id';
    sector_value: string;
    sector_label: string | null;
    n: number;
  };
  metrics: BenchmarkMetricRow[];
};

export async function getCompanyBenchmarkContext(ico: string): Promise<BenchmarkContext | null> {
  const pool = getPool();
  const variants = icoVariants(ico);
  if (!variants.length) return null;

  const res = await pool.query(
    `
    SELECT
      f.ico,
      f.fiscal_year,
      f.nace_division,
      (
        SELECT sd.main_activity_code_name
        FROM core.sd_org sd
        WHERE sd.ico = f.ico
          AND sd.nace_division = f.nace_division
        LIMIT 1
      ) AS nace_division_name,
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

export async function getCompanyBenchmark(
  ico: string,
  opts?: {
    fiscalYear?: number;
    geoLevel?: 'country' | 'kraj';
    sectorLevel?: 'nace_division' | 'main_activity_code_id';
  }
): Promise<CompanyBenchmarkResult | null> {
  const pool = getPool();
  const ctx = await getCompanyBenchmarkContext(ico);
  if (!ctx) return null;

  const fiscalYear = opts?.fiscalYear ?? ctx.fiscal_year;
  const geoLevel = opts?.geoLevel ?? 'kraj';
  const sectorLevel = opts?.sectorLevel ?? 'nace_division';

  const sectorValue =
    sectorLevel === 'main_activity_code_id'
      ? ctx.main_activity_code_id
      : ctx.nace_division;

  if (!sectorValue) return null;

  const sectorColumn =
    sectorLevel === 'main_activity_code_id'
      ? 'main_activity_code_id'
      : 'nace_division';

  const sectorLabel =
    sectorLevel === 'main_activity_code_id'
      ? ctx.main_activity_code_name
      : ctx.nace_division_name ?? ctx.nace_division;

  let geoValue = 'Slovensko';
  let sql = '';

  if (geoLevel === 'kraj') {
    if (!ctx.kraj) return null;
    geoValue = ctx.kraj;

    sql = `
      WITH company_row AS (
        SELECT *
        FROM core.mv_company_benchmark_facts
        WHERE ico = $1
          AND fiscal_year = $2
        LIMIT 1
      ),
      grp AS (
        SELECT g.*
        FROM core.mv_company_benchmark_facts g
        WHERE g.fiscal_year = $2
          AND g.kraj = $3
          AND g.${sectorColumn} = $4
      ),
      grp_n AS (
        SELECT COUNT(*)::int AS n FROM grp
      ),
      metric_base AS (
        SELECT
          'current_ratio' AS metric,
          (SELECT current_ratio FROM company_row) AS company_value,
          percentile_cont(0.25) WITHIN GROUP (ORDER BY current_ratio) AS p25_value,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY current_ratio) AS median_value,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY current_ratio) AS p75_value
        FROM grp WHERE current_ratio IS NOT NULL

        UNION ALL
        SELECT
          'equity_ratio',
          (SELECT equity_ratio FROM company_row),
          percentile_cont(0.25) WITHIN GROUP (ORDER BY equity_ratio),
          percentile_cont(0.50) WITHIN GROUP (ORDER BY equity_ratio),
          percentile_cont(0.75) WITHIN GROUP (ORDER BY equity_ratio)
        FROM grp WHERE equity_ratio IS NOT NULL

        UNION ALL
        SELECT
          'debt_ratio',
          (SELECT debt_ratio FROM company_row),
          percentile_cont(0.25) WITHIN GROUP (ORDER BY debt_ratio),
          percentile_cont(0.50) WITHIN GROUP (ORDER BY debt_ratio),
          percentile_cont(0.75) WITHIN GROUP (ORDER BY debt_ratio)
        FROM grp WHERE debt_ratio IS NOT NULL

        UNION ALL
        SELECT
          'roa',
          (SELECT roa FROM company_row),
          percentile_cont(0.25) WITHIN GROUP (ORDER BY roa),
          percentile_cont(0.50) WITHIN GROUP (ORDER BY roa),
          percentile_cont(0.75) WITHIN GROUP (ORDER BY roa)
        FROM grp WHERE roa IS NOT NULL

        UNION ALL
        SELECT
          'roe',
          (SELECT roe FROM company_row),
          percentile_cont(0.25) WITHIN GROUP (ORDER BY roe),
          percentile_cont(0.50) WITHIN GROUP (ORDER BY roe),
          percentile_cont(0.75) WITHIN GROUP (ORDER BY roe)
        FROM grp WHERE roe IS NOT NULL

        UNION ALL
        SELECT
          'net_margin',
          (SELECT net_margin FROM company_row),
          percentile_cont(0.25) WITHIN GROUP (ORDER BY net_margin),
          percentile_cont(0.50) WITHIN GROUP (ORDER BY net_margin),
          percentile_cont(0.75) WITHIN GROUP (ORDER BY net_margin)
        FROM grp WHERE net_margin IS NOT NULL

        UNION ALL
        SELECT
          'score_total',
          (SELECT score_total FROM company_row),
          percentile_cont(0.25) WITHIN GROUP (ORDER BY score_total),
          percentile_cont(0.50) WITHIN GROUP (ORDER BY score_total),
          percentile_cont(0.75) WITHIN GROUP (ORDER BY score_total)
        FROM grp WHERE score_total IS NOT NULL

        UNION ALL
        SELECT
          'pd_pct',
          (SELECT pd_pct FROM company_row),
          percentile_cont(0.25) WITHIN GROUP (ORDER BY pd_pct),
          percentile_cont(0.50) WITHIN GROUP (ORDER BY pd_pct),
          percentile_cont(0.75) WITHIN GROUP (ORDER BY pd_pct)
        FROM grp WHERE pd_pct IS NOT NULL
      ),
      ranked AS (
        SELECT
          m.metric,
          m.company_value,
          m.p25_value,
          m.median_value,
          m.p75_value,
          CASE
            WHEN m.company_value IS NULL THEN NULL
            ELSE (
              SELECT COUNT(*)::float / NULLIF((SELECT n FROM grp_n), 0)
              FROM grp
              WHERE CASE m.metric
                WHEN 'current_ratio' THEN current_ratio <= m.company_value
                WHEN 'equity_ratio' THEN equity_ratio <= m.company_value
                WHEN 'debt_ratio' THEN debt_ratio <= m.company_value
                WHEN 'roa' THEN roa <= m.company_value
                WHEN 'roe' THEN roe <= m.company_value
                WHEN 'net_margin' THEN net_margin <= m.company_value
                WHEN 'score_total' THEN score_total <= m.company_value
                WHEN 'pd_pct' THEN pd_pct <= m.company_value
              END
            )
          END AS percentile,
          (SELECT n FROM grp_n) AS n
        FROM metric_base m
      )
      SELECT
        r.*,

        -- leaders
        CASE r.metric
          WHEN 'current_ratio' THEN (
            SELECT g.ico FROM grp g
            WHERE g.current_ratio IS NOT NULL
            ORDER BY g.current_ratio DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'equity_ratio' THEN (
            SELECT g.ico FROM grp g
            WHERE g.equity_ratio IS NOT NULL
            ORDER BY g.equity_ratio DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'debt_ratio' THEN (
            SELECT g.ico FROM grp g
            WHERE g.debt_ratio IS NOT NULL
            ORDER BY g.debt_ratio ASC NULLS LAST
            LIMIT 1
          )
          WHEN 'roa' THEN (
            SELECT g.ico FROM grp g
            WHERE g.roa IS NOT NULL
            ORDER BY g.roa DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'roe' THEN (
            SELECT g.ico FROM grp g
            WHERE g.roe IS NOT NULL
            ORDER BY g.roe DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'net_margin' THEN (
            SELECT g.ico FROM grp g
            WHERE g.net_margin IS NOT NULL
            ORDER BY g.net_margin DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'score_total' THEN (
            SELECT g.ico FROM grp g
            WHERE g.score_total IS NOT NULL
            ORDER BY g.score_total DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'pd_pct' THEN (
            SELECT g.ico FROM grp g
            WHERE g.pd_pct IS NOT NULL
            ORDER BY g.pd_pct ASC NULLS LAST
            LIMIT 1
          )
        END AS leader_ico,

        CASE r.metric
          WHEN 'current_ratio' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.current_ratio IS NOT NULL
            ORDER BY g.current_ratio DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'equity_ratio' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.equity_ratio IS NOT NULL
            ORDER BY g.equity_ratio DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'debt_ratio' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.debt_ratio IS NOT NULL
            ORDER BY g.debt_ratio ASC NULLS LAST
            LIMIT 1
          )
          WHEN 'roa' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.roa IS NOT NULL
            ORDER BY g.roa DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'roe' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.roe IS NOT NULL
            ORDER BY g.roe DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'net_margin' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.net_margin IS NOT NULL
            ORDER BY g.net_margin DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'score_total' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.score_total IS NOT NULL
            ORDER BY g.score_total DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'pd_pct' THEN (
            SELECT o.name FROM grp g
            JOIN core.rpo_all_orgs o ON o.ico = g.ico
            WHERE g.pd_pct IS NOT NULL
            ORDER BY g.pd_pct ASC NULLS LAST
            LIMIT 1
          )
        END AS leader_name,

        CASE r.metric
          WHEN 'current_ratio' THEN (
            SELECT g.current_ratio FROM grp g
            WHERE g.current_ratio IS NOT NULL
            ORDER BY g.current_ratio DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'equity_ratio' THEN (
            SELECT g.equity_ratio FROM grp g
            WHERE g.equity_ratio IS NOT NULL
            ORDER BY g.equity_ratio DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'debt_ratio' THEN (
            SELECT g.debt_ratio FROM grp g
            WHERE g.debt_ratio IS NOT NULL
            ORDER BY g.debt_ratio ASC NULLS LAST
            LIMIT 1
          )
          WHEN 'roa' THEN (
            SELECT g.roa FROM grp g
            WHERE g.roa IS NOT NULL
            ORDER BY g.roa DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'roe' THEN (
            SELECT g.roe FROM grp g
            WHERE g.roe IS NOT NULL
            ORDER BY g.roe DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'net_margin' THEN (
            SELECT g.net_margin FROM grp g
            WHERE g.net_margin IS NOT NULL
            ORDER BY g.net_margin DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'score_total' THEN (
            SELECT g.score_total FROM grp g
            WHERE g.score_total IS NOT NULL
            ORDER BY g.score_total DESC NULLS LAST
            LIMIT 1
          )
          WHEN 'pd_pct' THEN (
            SELECT g.pd_pct FROM grp g
            WHERE g.pd_pct IS NOT NULL
            ORDER BY g.pd_pct ASC NULLS LAST
            LIMIT 1
          )
        END AS leader_value

      FROM ranked r
    `;

    const res = await pool.query(sql, [ctx.ico, fiscalYear, ctx.kraj, sectorValue]);

    return {
      context: ctx,
      benchmark: {
        geo_level: 'kraj',
        geo_value: ctx.kraj,
        sector_level: sectorLevel,
        sector_value: sectorValue,
        sector_label: sectorLabel,
        n: res.rows[0]?.n ?? 0
      },
      metrics: res.rows
    };
  }

  // country branch
  sql = `
    WITH company_row AS (
      SELECT *
      FROM core.mv_company_benchmark_facts
      WHERE ico = $1
        AND fiscal_year = $2
      LIMIT 1
    ),
    grp AS (
      SELECT g.*
      FROM core.mv_company_benchmark_facts g
      WHERE g.fiscal_year = $2
        AND g.${sectorColumn} = $3
    ),
    grp_n AS (
      SELECT COUNT(*)::int AS n FROM grp
    ),
    metric_base AS (
      SELECT
        'current_ratio' AS metric,
        (SELECT current_ratio FROM company_row) AS company_value,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY current_ratio) AS p25_value,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY current_ratio) AS median_value,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY current_ratio) AS p75_value
      FROM grp WHERE current_ratio IS NOT NULL

      UNION ALL
      SELECT 'equity_ratio', (SELECT equity_ratio FROM company_row),
        percentile_cont(0.25) WITHIN GROUP (ORDER BY equity_ratio),
        percentile_cont(0.50) WITHIN GROUP (ORDER BY equity_ratio),
        percentile_cont(0.75) WITHIN GROUP (ORDER BY equity_ratio)
      FROM grp WHERE equity_ratio IS NOT NULL

      UNION ALL
      SELECT 'debt_ratio', (SELECT debt_ratio FROM company_row),
        percentile_cont(0.25) WITHIN GROUP (ORDER BY debt_ratio),
        percentile_cont(0.50) WITHIN GROUP (ORDER BY debt_ratio),
        percentile_cont(0.75) WITHIN GROUP (ORDER BY debt_ratio)
      FROM grp WHERE debt_ratio IS NOT NULL

      UNION ALL
      SELECT 'roa', (SELECT roa FROM company_row),
        percentile_cont(0.25) WITHIN GROUP (ORDER BY roa),
        percentile_cont(0.50) WITHIN GROUP (ORDER BY roa),
        percentile_cont(0.75) WITHIN GROUP (ORDER BY roa)
      FROM grp WHERE roa IS NOT NULL

      UNION ALL
      SELECT 'roe', (SELECT roe FROM company_row),
        percentile_cont(0.25) WITHIN GROUP (ORDER BY roe),
        percentile_cont(0.50) WITHIN GROUP (ORDER BY roe),
        percentile_cont(0.75) WITHIN GROUP (ORDER BY roe)
      FROM grp WHERE roe IS NOT NULL

      UNION ALL
      SELECT 'net_margin', (SELECT net_margin FROM company_row),
        percentile_cont(0.25) WITHIN GROUP (ORDER BY net_margin),
        percentile_cont(0.50) WITHIN GROUP (ORDER BY net_margin),
        percentile_cont(0.75) WITHIN GROUP (ORDER BY net_margin)
      FROM grp WHERE net_margin IS NOT NULL

      UNION ALL
      SELECT 'score_total', (SELECT score_total FROM company_row),
        percentile_cont(0.25) WITHIN GROUP (ORDER BY score_total),
        percentile_cont(0.50) WITHIN GROUP (ORDER BY score_total),
        percentile_cont(0.75) WITHIN GROUP (ORDER BY score_total)
      FROM grp WHERE score_total IS NOT NULL

      UNION ALL
      SELECT 'pd_pct', (SELECT pd_pct FROM company_row),
        percentile_cont(0.25) WITHIN GROUP (ORDER BY pd_pct),
        percentile_cont(0.50) WITHIN GROUP (ORDER BY pd_pct),
        percentile_cont(0.75) WITHIN GROUP (ORDER BY pd_pct)
      FROM grp WHERE pd_pct IS NOT NULL
    ),
    ranked AS (
      SELECT
        m.metric,
        m.company_value,
        m.p25_value,
        m.median_value,
        m.p75_value,
        CASE
          WHEN m.company_value IS NULL THEN NULL
          ELSE (
            SELECT COUNT(*)::float / NULLIF((SELECT n FROM grp_n), 0)
            FROM grp
            WHERE CASE m.metric
              WHEN 'current_ratio' THEN current_ratio <= m.company_value
              WHEN 'equity_ratio' THEN equity_ratio <= m.company_value
              WHEN 'debt_ratio' THEN debt_ratio <= m.company_value
              WHEN 'roa' THEN roa <= m.company_value
              WHEN 'roe' THEN roe <= m.company_value
              WHEN 'net_margin' THEN net_margin <= m.company_value
              WHEN 'score_total' THEN score_total <= m.company_value
              WHEN 'pd_pct' THEN pd_pct <= m.company_value
            END
          )
        END AS percentile,
        (SELECT n FROM grp_n) AS n
      FROM metric_base m
    )
    SELECT
      r.*,

      -- leaders
      CASE r.metric
        WHEN 'current_ratio' THEN (
          SELECT g.ico FROM grp g
          WHERE g.current_ratio IS NOT NULL
          ORDER BY g.current_ratio DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'equity_ratio' THEN (
          SELECT g.ico FROM grp g
          WHERE g.equity_ratio IS NOT NULL
          ORDER BY g.equity_ratio DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'debt_ratio' THEN (
          SELECT g.ico FROM grp g
          WHERE g.debt_ratio IS NOT NULL
          ORDER BY g.debt_ratio ASC NULLS LAST
          LIMIT 1
        )
        WHEN 'roa' THEN (
          SELECT g.ico FROM grp g
          WHERE g.roa IS NOT NULL
          ORDER BY g.roa DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'roe' THEN (
          SELECT g.ico FROM grp g
          WHERE g.roe IS NOT NULL
          ORDER BY g.roe DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'net_margin' THEN (
          SELECT g.ico FROM grp g
          WHERE g.net_margin IS NOT NULL
          ORDER BY g.net_margin DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'score_total' THEN (
          SELECT g.ico FROM grp g
          WHERE g.score_total IS NOT NULL
          ORDER BY g.score_total DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'pd_pct' THEN (
          SELECT g.ico FROM grp g
          WHERE g.pd_pct IS NOT NULL
          ORDER BY g.pd_pct ASC NULLS LAST
          LIMIT 1
        )
      END AS leader_ico,

      CASE r.metric
        WHEN 'current_ratio' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.current_ratio IS NOT NULL
          ORDER BY g.current_ratio DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'equity_ratio' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.equity_ratio IS NOT NULL
          ORDER BY g.equity_ratio DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'debt_ratio' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.debt_ratio IS NOT NULL
          ORDER BY g.debt_ratio ASC NULLS LAST
          LIMIT 1
        )
        WHEN 'roa' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.roa IS NOT NULL
          ORDER BY g.roa DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'roe' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.roe IS NOT NULL
          ORDER BY g.roe DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'net_margin' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.net_margin IS NOT NULL
          ORDER BY g.net_margin DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'score_total' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.score_total IS NOT NULL
          ORDER BY g.score_total DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'pd_pct' THEN (
          SELECT o.name FROM grp g
          JOIN core.rpo_all_orgs o ON o.ico = g.ico
          WHERE g.pd_pct IS NOT NULL
          ORDER BY g.pd_pct ASC NULLS LAST
          LIMIT 1
        )
      END AS leader_name,

      CASE r.metric
        WHEN 'current_ratio' THEN (
          SELECT g.current_ratio FROM grp g
          WHERE g.current_ratio IS NOT NULL
          ORDER BY g.current_ratio DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'equity_ratio' THEN (
          SELECT g.equity_ratio FROM grp g
          WHERE g.equity_ratio IS NOT NULL
          ORDER BY g.equity_ratio DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'debt_ratio' THEN (
          SELECT g.debt_ratio FROM grp g
          WHERE g.debt_ratio IS NOT NULL
          ORDER BY g.debt_ratio ASC NULLS LAST
          LIMIT 1
        )
        WHEN 'roa' THEN (
          SELECT g.roa FROM grp g
          WHERE g.roa IS NOT NULL
          ORDER BY g.roa DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'roe' THEN (
          SELECT g.roe FROM grp g
          WHERE g.roe IS NOT NULL
          ORDER BY g.roe DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'net_margin' THEN (
          SELECT g.net_margin FROM grp g
          WHERE g.net_margin IS NOT NULL
          ORDER BY g.net_margin DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'score_total' THEN (
          SELECT g.score_total FROM grp g
          WHERE g.score_total IS NOT NULL
          ORDER BY g.score_total DESC NULLS LAST
          LIMIT 1
        )
        WHEN 'pd_pct' THEN (
          SELECT g.pd_pct FROM grp g
          WHERE g.pd_pct IS NOT NULL
          ORDER BY g.pd_pct ASC NULLS LAST
          LIMIT 1
        )
      END AS leader_value

    FROM ranked r
  `;

  const res = await pool.query(sql, [ctx.ico, fiscalYear, sectorValue]);

  return {
    context: ctx,
    benchmark: {
      geo_level: 'country',
      geo_value: 'Slovensko',
      sector_level: sectorLevel,
      sector_value: sectorValue,
      sector_label: sectorLabel,
      n: res.rows[0]?.n ?? 0
    },
    metrics: res.rows
  };
}

export async function getSitemapCompanyCount(): Promise<number> {
  const pool = getPool();

  const res = await pool.query(
    `
    SELECT COUNT(*)::int AS cnt
    FROM core.rpo_all_orgs
    WHERE legal_form_code IN ('112', '121')
      AND ico IS NOT NULL
      AND trim(ico) <> ''
    `
  );

  return res.rows[0]?.cnt ?? 0;
}

export async function getSitemapCompanies(limit: number, offset: number): Promise<{ ico: string }[]> {
  const pool = getPool();

  const res = await pool.query(
    `
    SELECT ico
    FROM core.rpo_all_orgs
    WHERE legal_form_code IN ('112', '121')
      AND ico IS NOT NULL
      AND trim(ico) <> ''
    ORDER BY ico
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return res.rows;
}
