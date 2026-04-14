export default function MetricCard({
  label,
  value,
  sub,
  info,
  tone,
  hint
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'neutral' | 'bad';
  info?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-slate-900/5 p-4 dark:border-white/10 dark:bg-black/20">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</div>

        {info ? (
          <div className="group relative">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-900/20 text-[11px] font-semibold text-slate-700 dark:border-white/20 dark:text-slate-300"
              aria-label="Info"
            >
              i
            </div>

            <div className="pointer-events-none absolute right-0 top-6 z-10 hidden w-72 rounded-xl border border-slate-900/10 bg-white p-3 text-xs text-slate-700 shadow-xl group-hover:block dark:border-white/10 dark:bg-[#081025] dark:text-slate-300">
              <div className="font-medium text-slate-900 dark:text-white">Čo to znamená</div>
              <div className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">{info}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`mt-1 text-lg font-semibold ${
          tone === 'good'
            ? 'text-emerald-700 dark:text-emerald-300'
            : tone === 'bad'
            ? 'text-rose-700 dark:text-rose-300'
            : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </div>

      {sub ? <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{sub}</div> : null}

      {hint ? (
        <div className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
