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
  return Number(x).toLocaleString('sk-SK', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function fmtRatio(x: number | null) {
  if (x === null || typeof x === 'undefined') return '—';
  return Number(x).toLocaleString('sk-SK', { maximumFractionDigits: 2 });
}

function fmtPct(x: number | null) {
  if (x === null || typeof x === 'undefined') return '—';
  return `${(Number(x) * 100).toLocaleString('sk-SK', { maximumFractionDigits: 1 })}%`;
}

function riskLabel(pd: number) {
  if (pd < 0.02) return { label: 'Veľmi nízke riziko', color: 'text-green-600' };
  if (pd < 0.05) return { label: 'Nízke riziko', color: 'text-green-500' };
  if (pd < 0.10) return { label: 'Stredné riziko', color: 'text-yellow-600' };
  if (pd < 0.20) return { label: 'Zvýšené riziko', color: 'text-orange-600' };
  return { label: 'Vysoké riziko', color: 'text-red-600' };
}

function evaluateRatio(value: number | null, type: string): 'good' | 'neutral' | 'bad' {
  if (value === null || typeof value === 'undefined') return 'neutral';

  switch (type) {
    case 'current_ratio':
      if (value >= 1.5) return 'good';
      if (value < 1) return 'bad';
      return 'neutral';

    case 'quick_ratio':
      if (value >= 1.0) return 'good';
      if (value < 0.7) return 'bad';
      return 'neutral';

    case 'cash_ratio':
      if (value >= 0.2) return 'good';
      if (value < 0.05) return 'bad';
      return 'neutral';

    case 'equity_ratio':
      if (value >= 0.4) return 'good';
      if (value < 0.2) return 'bad';
      return 'neutral';

    case 'debt_ratio':
      if (value <= 0.5) return 'good';
      if (value > 0.8) return 'bad';
      return 'neutral';

    case 'debt_to_equity':
      if (value <= 1.5) return 'good';
      if (value > 3) return 'bad';
      return 'neutral';

    case 'roa':
      if (value >= 0.05) return 'good';
      if (value < 0) return 'bad';
      return 'neutral';

    case 'roe':
      if (value >= 0.10) return 'good';
      if (value < 0) return 'bad';
      return 'neutral';

    case 'net_margin':
      if (value >= 0.10) return 'good';
      if (value < 0) return 'bad';
      return 'neutral';

    case 'interest_coverage':
      if (value >= 3) return 'good';
      if (value < 1) return 'bad';
      return 'neutral';

    default:
      return 'neutral';
  }
}

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
  const pdLatest = pdSeries.length ? pdSeries[pdSeries.length - 1] : null;

  const flags = features
    ? [
        { k: 'negative_equity_flag', label: 'Negatívne vlastné imanie', v: features.negative_equity_flag },
        { k: 'liquidity_breach_flag', label: 'Problém s likviditou', v: features.liquidity_breach_flag },
        { k: 'high_leverage_flag', label: 'Vysoká zadlženosť', v: features.high_leverage_flag },
        { k: 'loss_flag', label: 'Strata', v: features.loss_flag }
      ]
    : [];

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{identity.name ?? '(bez názvu)'}</h1>
            <div className="mt-1 text-sm text-zinc-600">
              <span className="font-medium text-zinc-700">IČO:</span>{' '}
              <span className="font-mono">{identity.ico}</span>
              {identity.legal_form_name ? <span> • {identity.legal_form_name}</span> : null}
              {identity.status ? <span> • {identity.status}</span> : null}
            </div>
            {identity.address ? <div className="mt-1 text-sm text-zinc-500">{identity.address}</div> : null}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-zinc-500">
                <div className="font-medium text-zinc-700">{latest?.fiscal_year ?? '—'}</div>
                <div>score {latest?.score_total ?? '—'}</div>
              </div>
              <GradeBadge grade={latest?.grade} />
            </div>

            {pdLatest ? (
              <div className="min-w-[180px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm">
                <div className="text-xs text-zinc-500">Pravdepodobnosť bankrotu (12M)</div>
                <div className="text-sm font-semibold">
                  {(pdLatest.pd_12m * 100).toLocaleString('sk-SK', { maximumFractionDigits: 2 })} %
                </div>
                <div className={`text-xs font-medium ${riskLabel(pdLatest.pd_12m).color}`}>
                  {riskLabel(pdLatest.pd_12m).label}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-sm font-semibold">Kľúčové ukazovatele</h2>
          <div className="text-xs text-zinc-500">
            {features?.fiscal_year ? (
              <span>
                Posledný dostupný rok: <span className="font-medium text-zinc-700">{features.fiscal_year}</span>
                {features.period_end ? <span> (k {features.period_end})</span> : null}
              </span>
            ) : (
              '—'
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Bežná likvidita (Current ratio)"
            value={fmtRatio(features?.current_ratio ?? null)}
            tone={evaluateRatio(features?.current_ratio ?? null, 'current_ratio')}
            sub="Obežné aktíva / krátkodobé záväzky"
            info="Hovorí, či firma vie z obežných aktív pokryť krátkodobé záväzky. Zjednodušene: čím vyššie, tým väčší likviditný vankúš. Príliš vysoké hodnoty môžu znamenať neefektívne viazanie kapitálu."
          />
          <MetricCard
            label="Pohotová likvidita (Quick ratio)"
            value={fmtRatio(features?.quick_ratio ?? null)}
            tone={evaluateRatio(features?.quick_ratio ?? null, 'quick_ratio')}
            sub="(Obežné aktíva – zásoby) / krátkodobé záväzky"
            info="Prísnejšia verzia likvidity – odfiltruje zásoby, ktoré nemusia byť rýchlo speňažiteľné. Užitočné pri firmách, kde zásoby tvoria veľký podiel obežných aktív."
          />
          <MetricCard
            label="Okamžitá likvidita (Cash ratio)"
            value={fmtRatio(features?.cash_ratio ?? null)}
            tone={evaluateRatio(features?.cash_ratio ?? null, 'cash_ratio')}
            sub="Hotovosť a ekvivalenty / krátkodobé záväzky"
            info="Najprísnejší ukazovateľ likvidity. Hovorí, do akej miery vie firma splatiť krátkodobé záväzky iba z hotovosti."
          />

          <MetricCard
            label="Podiel vlastného imania (Equity ratio)"
            value={fmtPct(features?.equity_ratio ?? null)}
            tone={evaluateRatio(features?.equity_ratio ?? null, 'equity_ratio')}
            sub="Vlastné imanie / aktíva"
            info="Vyjadruje, aká časť majetku je financovaná vlastnými zdrojmi. Vyšší podiel zvyčajne znamená stabilnejšiu kapitálovú štruktúru (menšie riziko)."
          />
          <MetricCard
            label="Zadlženosť (Debt ratio)"
            value={fmtPct(features?.debt_ratio ?? null)}
            tone={evaluateRatio(features?.debt_ratio ?? null, 'debt_ratio')}
            sub="Záväzky / aktíva"
            info="Podiel cudzieho kapitálu na aktívach. Vyššie hodnoty znamenajú vyššiu finančnú páku a citlivosť na pokles tržieb či rast úrokov."
          />
          <MetricCard
            label="Dlh / vlastné imanie (Debt-to-equity)"
            value={fmtRatio(features?.debt_to_equity ?? null)}
            tone={evaluateRatio(features?.debt_to_equity ?? null, 'debt_to_equity')}
            sub="Záväzky / vlastné imanie"
            info="Ukazuje, koľko cudzieho kapitálu pripadá na 1 jednotku vlastného imania. Pri veľmi nízkom alebo zápornom vlastnom imaní môže byť interpretácia problematická."
          />

          <MetricCard
            label="Rentabilita aktív (ROA)"
            value={fmtPct(features?.roa ?? null)}
            tone={evaluateRatio(features?.roa ?? null, 'roa')}
            sub="Zisk / aktíva"
            info="Meria efektivitu využitia majetku firmy na tvorbu zisku. Vyššie ROA znamená, že aktíva prinášajú viac zisku."
          />
          <MetricCard
            label="Rentabilita vlastného imania (ROE)"
            value={fmtPct(features?.roe ?? null)}
            tone={evaluateRatio(features?.roe ?? null, 'roe')}
            sub="Zisk / vlastné imanie"
            info="Výnosnosť pre vlastníkov. ROE býva vyššie pri využívaní dlhu (finančná páka), ale to zároveň zvyšuje riziko."
          />
          <MetricCard
            label="Čistá marža (Net margin)"
            value={fmtPct(features?.net_margin ?? null)}
            tone={evaluateRatio(features?.net_margin ?? null, 'net_margin')}
            sub="Zisk / tržby"
            info="Koľko percent z tržieb ostane firme ako čistý zisk. Pomáha porovnať ziskovosť medzi rokmi aj medzi firmami v odvetví."
          />

          <MetricCard
            label="Obrat aktív (Asset turnover)"
            value={fmtRatio(features?.asset_turnover ?? null)}
            sub="Tržby / aktíva"
            info="Ako intenzívne firma využíva aktíva na generovanie tržieb. Vyššie hodnoty znamenajú efektívnejšie využitie majetku."
          />
          <MetricCard
            label="Úrokové krytie (Interest coverage)"
            value={fmtRatio(features?.interest_coverage ?? null)}
            tone={evaluateRatio(features?.interest_coverage ?? null, 'interest_coverage')}
            sub="Prevádzkový výsledok / úrokové náklady"
            info="Koľkokrát firma pokryje úrokové náklady zo svojho výsledku hospodárenia. Nízke hodnoty naznačujú, že aj menší pokles výkonu môže spôsobiť problém so splácaním úrokov."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
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

      <section className="space-y-3">
        <CompanyCharts ico={identity.ico} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Diagnostika (flagy)</h2>
        {features ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {flags.map((f) => (
              <div
                key={f.k}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm"
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