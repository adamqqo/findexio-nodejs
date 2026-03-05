import GradeBadge from '@/components/GradeBadge';
import MetricCard from '@/components/MetricCard';
import CompanyCharts from '@/components/CompanyCharts';
import Link from 'next/link';
import {
  getCompanyGrades,
  getCompanyIdentity,
  getCompanyLatestFeatures,
  getCompanyPdSeries
} from '@/lib/queries';

function fmtNum(x: number | null, digits = 2) {
  if (x === null || typeof x === 'undefined') return '—';
  return Number(x).toLocaleString('sk-SK', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  });
}

function fmtRatio(x: number | null) {
  if (x === null || typeof x === 'undefined') return '—';
  return Number(x).toLocaleString('sk-SK', { maximumFractionDigits: 2 });
}

function fmtPct(x: number | null) {
  if (x === null || typeof x === 'undefined') return '—';
  return `${(Number(x) * 100).toLocaleString('sk-SK', {
    maximumFractionDigits: 1
  })}%`;
}

function toNum(x: unknown): number | null {
  if (x === null || typeof x === 'undefined') return null;
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x === 'string' && x.trim() !== '') {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/* ---------- RISK LOGIC BASED ON PERCENTILE (ML) ---------- */

function riskLabelFromPct(pd_pct: number) {
  if (pd_pct < 0.5) return { label: 'Nízke riziko', color: 'text-green-600' };
  if (pd_pct < 0.8) return { label: 'Stredné riziko', color: 'text-yellow-600' };
  if (pd_pct < 0.95) return { label: 'Zvýšené riziko', color: 'text-orange-600' };
  return { label: 'Vysoké riziko', color: 'text-red-600' };
}

function fmtPercentile01(x: number) {
  return Math.round(x * 100);
}

function fmtProb(pd_12m: number) {
  return `${(pd_12m * 100).toLocaleString('sk-SK', {
    maximumFractionDigits: 2
  })}%`;
}

/* ---------- Slovak discriminant model (Gajdošíková et al.) ----------
   Paper uses y_SK discriminant score, compare with 0:
   - for Slovakia: y_SK > 0 => non-prosperous; y_SK < 0 => prosperous
*/
function skLabelFromScore(y: number) {
  // Keep it simple + interpretable
  if (y > 0) return { label: 'Riziková (ySK > 0)', color: 'text-red-600' };
  return { label: 'Stabilnejšia (ySK < 0)', color: 'text-green-600' };
}

// model_sk_pct can be:
// - either a percentile-like 0..1
// - OR a raw discriminant score (ySK)
// We try to present it safely.
function interpretModelSk(modelSk: number) {
  const looksLikePct = modelSk >= 0 && modelSk <= 1;
  if (looksLikePct) {
    // “percentile-style” display, keep labels similar to ML block
    const p = modelSk;
    const label =
      p < 0.5
        ? { label: 'Nižšie riziko', color: 'text-green-600' }
        : p < 0.8
        ? { label: 'Stredné riziko', color: 'text-yellow-600' }
        : p < 0.95
        ? { label: 'Zvýšené riziko', color: 'text-orange-600' }
        : { label: 'Vysoké riziko', color: 'text-red-600' };

    return {
      mode: 'pct' as const,
      pct: p,
      label
    };
  }

  // raw ySK
  return {
    mode: 'ysk' as const,
    ysk: modelSk,
    label: skLabelFromScore(modelSk)
  };
}

/* ---------- THRESHOLDS (aligned with sources) -------- */

type Tone = 'good' | 'neutral' | 'bad';

const SRC = {
  KOTULIC_2018: 'Kotulič et al., 2018',
  VERNIMMEN_2022: 'Vernimmen et al., 2022'
} as const;

function evaluateRatio(value: number | null, type: string): Tone {
  if (value === null || typeof value === 'undefined') return 'neutral';

  switch (type) {
    case 'current_ratio':
      if (value < 1.0) return 'bad';
      if (value >= 1.5 && value <= 2.5) return 'good';
      return 'neutral';

    case 'quick_ratio':
      if (value < 0.7) return 'bad';
      if (value >= 1.0 && value <= 1.5) return 'good';
      return 'neutral';

    case 'cash_ratio':
      if (value < 0.1) return 'bad';
      if (value >= 0.2 && value <= 0.8) return 'good';
      return 'neutral';

    case 'equity_ratio':
      if (value < 0.2) return 'bad';
      if (value >= 0.3) return 'good';
      return 'neutral';

    case 'debt_ratio':
      if (value > 0.8) return 'bad';
      if (value <= 0.5) return 'good';
      return 'neutral';

    case 'debt_to_equity':
      if (value > 2.0) return 'bad';
      if (value < 1.0) return 'good';
      return 'neutral';

    case 'roa':
      if (value < 0.08) return 'bad';
      if (value > 0.15) return 'good';
      return 'neutral';

    case 'roe':
      if (value < 0.05) return 'bad';
      if (value > 0.12) return 'good';
      return 'neutral';

    case 'net_margin':
      if (value < 0) return 'bad';
      if (value >= 0.1) return 'good';
      return 'neutral';

    case 'interest_coverage':
      if (value < 1.0) return 'bad';
      if (value >= 3.0) return 'good';
      return 'neutral';

    default:
      return 'neutral';
  }
}

type MetricMeta = { hint: string };

const METRIC_META: Record<string, MetricMeta> = {
  current_ratio: {
    hint: `Optimum 1,5–2,5 (${SRC.KOTULIC_2018}). Nad optimum je často neutrálne: môže ísť o neefektívne viazaný kapitál v obežných aktívach.`
  },
  quick_ratio: {
    hint: `Optimum 1,0–1,5 (${SRC.KOTULIC_2018}). Nad optimum býva neutrálne: prebytočná likvidita môže znamenať nevyužité zdroje.`
  },
  cash_ratio: {
    hint: `Optimum 0,2–0,8 (${SRC.KOTULIC_2018}). Nad optimum je často neutrálne: firma môže držať „príliš veľa“ hotovosti namiesto investovania.`
  },
  equity_ratio: {
    hint: `Odporúčané neklesnúť pod 20–30 % (${SRC.KOTULIC_2018}). Vyššie hodnoty sú zvyčajne priaznivé (väčšia finančná stabilita).`
  },
  debt_ratio: {
    hint: `Odporúčané ≤ 50 %, za krajnú hranicu sa považuje ~70–80 % (${SRC.KOTULIC_2018}).`
  },
  debt_to_equity: {
    hint: `Najlepšie < 1, za optimálne sa považuje < 2 (${SRC.KOTULIC_2018}).`
  },
  roa: {
    hint: `< 8 % slabé, > 15 % nadpriemerné (${SRC.VERNIMMEN_2022}). Hodnotiť v kontexte odvetvia a nákladov kapitálu.`
  },
  roe: {
    hint: `< 5 % slabé, > 12 % nadpriemerné (${SRC.VERNIMMEN_2022}). Hodnotiť v kontexte odvetvia a nákladov kapitálu.`
  },
  net_margin: {
    hint: `Odporúča sa aspoň 10 % (${SRC.KOTULIC_2018}).`
  },
  interest_coverage: {
    hint: `Minimum 1, odporúčaný interval 3–5 (${SRC.KOTULIC_2018}). Nad intervalom je neutrálne až pozitívne: firma má komfort pri obsluhe dlhu.`
  },
  asset_turnover: {
    hint: `Bez univerzálnych hraníc — výrazne závisí od odvetvia. Zmysel má porovnanie v čase a voči konkurencii (${SRC.KOTULIC_2018}).`
  }
};

/* ---------- status label mapping ---------- */

function companyStatusBadge(status: string | null | undefined): { label: string; cls: string } | null {
  const s = (status ?? '').toString().trim().toLowerCase();
  if (!s) return null;

  if (s === 'active') {
    return { label: 'Aktívna', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  }
  if (s === 'terminated') {
    return { label: 'Zrušená', cls: 'border-zinc-300 bg-zinc-100 text-zinc-700' };
  }

  return { label: status ?? '—', cls: 'border-zinc-200 bg-white text-zinc-700' };
}

/* ------------------------------------------------ */

export default async function CompanyPage({ params }: { params: Promise<{ ico: string }> }) {
  const { ico: rawIco } = await params;
  const ico = (rawIco ?? '').toString().trim().replace(/[^0-9]/g, '');

  const [identity, grades, features, pdSeries] = await Promise.all([
    getCompanyIdentity(ico),
    getCompanyGrades(ico),
    getCompanyLatestFeatures(ico),
    getCompanyPdSeries(ico)
  ]);

  if (!identity) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Firma nenájdená</h1>
        <p className="text-sm text-zinc-600">
          Neexistuje záznam pre IČO: <span className="font-mono">{rawIco}</span>
        </p>
        <Link href="/" className="text-sm">
          Späť na vyhľadávanie
        </Link>
      </div>
    );
  }

  const latest = grades.length ? grades[grades.length - 1] : null;

  // ML PD
  const pdLatestRaw = pdSeries.length ? (pdSeries[pdSeries.length - 1] as any) : null;
  const pd12 = pdLatestRaw ? toNum(pdLatestRaw.pd_12m) : null;
  const pdPct = pdLatestRaw ? toNum(pdLatestRaw.pd_pct) : null;

  // Slovak model metric (ensure your query returns it)
  const modelSkRaw = features ? (features as any).model_sk_pct : null;
  const modelSk = toNum(modelSkRaw);
  const modelSkInterpreted = typeof modelSk === 'number' ? interpretModelSk(modelSk) : null;

  const flags = features
    ? [
        { k: 'negative_equity_flag', label: 'Negatívne vlastné imanie', v: features.negative_equity_flag },
        { k: 'liquidity_breach_flag', label: 'Problém s likviditou', v: features.liquidity_breach_flag },
        { k: 'high_leverage_flag', label: 'Vysoká zadlženosť', v: features.high_leverage_flag },
        { k: 'loss_flag', label: 'Strata', v: features.loss_flag }
      ]
    : [];

  const statusBadge = companyStatusBadge(identity.status);

  return (
    <div className="space-y-8">
      {/* “PAGE BACKPLATE” to visually separate sections */}
      <div className="rounded-3xl bg-zinc-50 p-4 sm:p-6">
        {/* HEADER */}
        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{identity.name ?? '(bez názvu)'}</h1>

                {statusBadge ? (
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                ) : null}
              </div>

              <div className="mt-1 text-sm text-zinc-600">
                <span className="font-medium text-zinc-700">IČO:</span>{' '}
                <span className="font-mono">{identity.ico}</span>
                {identity.legal_form_name ? <span> • {identity.legal_form_name}</span> : null}
              </div>

              {identity.address ? <div className="mt-1 text-sm text-zinc-500">{identity.address}</div> : null}

              {/* Jump links (so user notices content below) */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <a href="#metrics" className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700">
                  Ukazovatele
                </a>
                <a href="#charts" className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700">
                  Grafy
                </a>
                <a href="#scores" className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700">
                  Skóre
                </a>
                <a href="#flags" className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700">
                  Diagnostika
                </a>
              </div>
            </div>

            {/* RIGHT SIDE: Summary cards */}
            <div className="grid w-full gap-3 sm:w-[520px]">
              {/* Grade card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-zinc-500">
                    <div className="font-medium text-zinc-700">{latest?.fiscal_year ?? '—'}</div>
                    <div>score {latest?.score_total ?? '—'}</div>
                  </div>
                  <GradeBadge grade={latest?.grade} />
                </div>
              </div>

              {/* Risk cards (ML + Slovak model) */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* ML */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-zinc-500">Riziko (ML)</div>

                      {typeof pdPct === 'number' ? (
                        <>
                          <div className="mt-1 text-sm font-semibold">{fmtPercentile01(pdPct)} %</div>
                          <div className={`text-xs font-medium ${riskLabelFromPct(pdPct).color}`}>
                            {riskLabelFromPct(pdPct).label}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mt-1 text-sm font-semibold">—</div>
                          <div className="text-xs font-medium text-zinc-500">Percentil nie je dostupný</div>
                        </>
                      )}
                    </div>

                    <div className="group relative mt-0.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[11px] font-semibold text-zinc-600">
                        i
                      </div>

                      <div className="pointer-events-none absolute right-0 top-6 z-10 hidden w-80 rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs text-zinc-700 shadow-lg group-hover:block">
                        <div className="font-medium text-zinc-900">Čo znamená ML percentil</div>
                        <div className="mt-1 leading-relaxed">
                          Percentil je relatívne poradie firmy medzi ostatnými. Vyššie % = firma patrí medzi rizikovejšie
                          podľa modelu (nie je to priama pravdepodobnosť).
                        </div>
                      </div>
                    </div>
                  </div>

                  {typeof pd12 === 'number' ? (
                    <div className="mt-2 text-[11px] text-zinc-500">
                      Odhad PD (12m): <span className="font-medium text-zinc-700">{fmtProb(pd12)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Slovak discriminant model */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-zinc-500">Riziko (SK model)</div>

                      {modelSkInterpreted ? (
                        modelSkInterpreted.mode === 'pct' ? (
                          <>
                            <div className="mt-1 text-sm font-semibold">{fmtPercentile01(modelSkInterpreted.pct)} %</div>
                            <div className={`text-xs font-medium ${modelSkInterpreted.label.color}`}>
                              {modelSkInterpreted.label.label}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mt-1 text-sm font-semibold">{fmtNum(modelSkInterpreted.ysk, 3)}</div>
                            <div className={`text-xs font-medium ${modelSkInterpreted.label.color}`}>
                              {modelSkInterpreted.label.label}
                            </div>
                          </>
                        )
                      ) : (
                        <>
                          <div className="mt-1 text-sm font-semibold">—</div>
                          <div className="text-xs font-medium text-zinc-500">Nedostupné</div>
                        </>
                      )}
                    </div>

                    <div className="group relative mt-0.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[11px] font-semibold text-zinc-600">
                        i
                      </div>

                      <div className="pointer-events-none absolute right-0 top-6 z-10 hidden w-80 rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs text-zinc-700 shadow-lg group-hover:block">
                        <div className="font-medium text-zinc-900">Slovenský diskriminačný model</div>
                        <div className="mt-1 leading-relaxed">
                          Model používa skóre{' '}
                          <span className="font-medium">ySK = −0,520 + 4,439X1 − 8,107X2 − 0,494X4 − 0,594X7 − 0,022X8 − 0,116X9 + 1,787X10</span>.
                          Interpretácia je jednoduchá: pre Slovensko{' '}
                          <span className="font-medium">ySK &gt; 0</span> signalizuje „non-prosperous“,{' '}
                          <span className="font-medium">ySK &lt; 0</span> „prosperous“. (Gajdošíková et al., 2025)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                    Je to „benchmark“ model z literatúry: rýchly signál podľa dlhových ukazovateľov (nie ML).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* METRIC CARDS */}
      <section id="metrics" className="space-y-3 scroll-mt-24">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-sm font-semibold">Kľúčové ukazovatele</h2>
          <div className="text-xs text-zinc-500">
            {features?.fiscal_year ? (
              <span>
                Posledný dostupný rok:{' '}
                <span className="font-medium text-zinc-700">{features.fiscal_year}</span>
                {features.period_end ? <span> (k {features.period_end})</span> : null}
              </span>
            ) : (
              '—'
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Celková likvidita (Current ratio)"
            value={fmtRatio(features?.current_ratio ?? null)}
            tone={evaluateRatio(features?.current_ratio ?? null, 'current_ratio')}
            sub="Krátkodobý majetok / krátkodobý cudzí kapitál"
            info="Hovorí, či firma vie z obežných aktív pokryť krátkodobé záväzky."
            hint={METRIC_META.current_ratio.hint}
          />

          <MetricCard
            label="Bežná likvidita (Quick ratio)"
            value={fmtRatio(features?.quick_ratio ?? null)}
            tone={evaluateRatio(features?.quick_ratio ?? null, 'quick_ratio')}
            sub="(Krátkodobý majetok – zásoby) / krátkodobý cudzí kapitál"
            info="Prísnejšia verzia likvidity – odfiltruje zásoby."
            hint={METRIC_META.quick_ratio.hint}
          />

          <MetricCard
            label="Pohotová likvidita (Cash ratio)"
            value={fmtRatio(features?.cash_ratio ?? null)}
            tone={evaluateRatio(features?.cash_ratio ?? null, 'cash_ratio')}
            sub="Finančné účty / krátkodobý cudzí kapitál"
            info="Najprísnejší ukazovateľ likvidity – len z hotovosti."
            hint={METRIC_META.cash_ratio.hint}
          />

          <MetricCard
            label="Podiel vlastného imania (Equity ratio)"
            value={fmtPct(features?.equity_ratio ?? null)}
            tone={evaluateRatio(features?.equity_ratio ?? null, 'equity_ratio')}
            sub="Vlastné imanie / aktíva"
            info="Aká časť majetku je financovaná vlastnými zdrojmi."
            hint={METRIC_META.equity_ratio.hint}
          />

          <MetricCard
            label="Zadlženosť (Debt ratio)"
            value={fmtPct(features?.debt_ratio ?? null)}
            tone={evaluateRatio(features?.debt_ratio ?? null, 'debt_ratio')}
            sub="Záväzky / aktíva"
            info="Podiel cudzieho kapitálu na aktívach."
            hint={METRIC_META.debt_ratio.hint}
          />

          <MetricCard
            label="Dlh / vlastné imanie (Debt-to-equity)"
            value={fmtRatio(features?.debt_to_equity ?? null)}
            tone={evaluateRatio(features?.debt_to_equity ?? null, 'debt_to_equity')}
            sub="Záväzky / vlastné imanie"
            info="Koľko cudzieho kapitálu pripadá na 1 jednotku vlastného imania."
            hint={METRIC_META.debt_to_equity.hint}
          />

          <MetricCard
            label="Rentabilita aktív (ROA)"
            value={fmtPct(features?.roa ?? null)}
            tone={evaluateRatio(features?.roa ?? null, 'roa')}
            sub="Zisk / aktíva"
            info="Efektivita využitia majetku na tvorbu zisku."
            hint={METRIC_META.roa.hint}
          />

          <MetricCard
            label="Rentabilita vlastného imania (ROE)"
            value={fmtPct(features?.roe ?? null)}
            tone={evaluateRatio(features?.roe ?? null, 'roe')}
            sub="Zisk / vlastné imanie"
            info="Výnosnosť pre vlastníkov."
            hint={METRIC_META.roe.hint}
          />

          <MetricCard
            label="Čistá marža (Net margin)"
            value={fmtPct(features?.net_margin ?? null)}
            tone={evaluateRatio(features?.net_margin ?? null, 'net_margin')}
            sub="Zisk / tržby"
            info="Koľko percent z tržieb ostane ako čistý zisk."
            hint={METRIC_META.net_margin.hint}
          />

          <MetricCard
            label="Obrat aktív (Asset turnover)"
            value={fmtRatio(features?.asset_turnover ?? null)}
            sub="Tržby / aktíva"
            info="Ako intenzívne firma využíva aktíva na generovanie tržieb."
            hint={METRIC_META.asset_turnover.hint}
          />

          <MetricCard
            label="Úrokové krytie (Interest coverage)"
            value={fmtRatio(features?.interest_coverage ?? null)}
            tone={evaluateRatio(features?.interest_coverage ?? null, 'interest_coverage')}
            sub="Prevádzkový výsledok / úrokové náklady"
            info="Koľkokrát firma pokryje úrokové náklady zo svojho výsledku."
            hint={METRIC_META.interest_coverage.hint}
          />
        </div>
      </section>

      {/* CHARTS (give it a clear “panel” so it stands out) */}
      <section id="charts" className="scroll-mt-24">
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold">Grafy</h2>
              <div className="mt-1 text-xs text-zinc-500">Vývoj ukazovateľov v čase</div>
            </div>
            <div className="text-xs text-zinc-500">norm_period = 1</div>
          </div>

          <CompanyCharts ico={identity.ico} />
        </div>
      </section>

      {/* SCORE TABLE */}
      <section id="scores" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Vývoj skóre</h2>
          <div className="text-xs text-zinc-500">norm_period = 1</div>
        </div>

        {grades.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-2 pr-4">Rok</th>
                  <th className="py-2 pr-4">Grade</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2">Poznámka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {grades
                  .slice()
                  .reverse()
                  .map((g) => (
                    <tr key={g.fiscal_year}>
                      <td className="py-2 pr-4 font-medium">{g.fiscal_year}</td>
                      <td className="py-2 pr-4">{g.grade ?? '—'}</td>
                      <td className="py-2 pr-4">{fmtNum(g.score_total ?? null, 0)}</td>
                      <td className="py-2 text-zinc-600">{g.reason ?? ''}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-600">Pre túto firmu zatiaľ nie je dostupné skóre.</p>
        )}
      </section>

      {/* FLAGS */}
      <section id="flags" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Diagnostika (flagy)</h2>
        {features ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {flags.map((f) => (
              <div
                key={f.k}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="text-zinc-700">{f.label}</span>
                <span className={`text-xs font-medium ${f.v ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  {f.v ? 'Áno' : 'Nie'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-600">Features zatiaľ nie sú dostupné.</p>
        )}
      </section>

      <div>
        <Link href="/" className="text-sm">
          Späť na vyhľadávanie
        </Link>
      </div>
    </div>
  );
}