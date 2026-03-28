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
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>

        {info ? (
          <div className="group relative">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-600"
              aria-label="Info"
            >
              i
            </div>

            <div className="pointer-events-none absolute right-0 top-6 z-10 hidden w-72 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg group-hover:block">
              <div className="font-medium text-slate-900">Čo to znamená</div>
              <div className="mt-1 leading-relaxed text-slate-700">{info}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`mt-1 text-lg font-semibold ${
          tone === 'good'
            ? 'text-emerald-600'
            : tone === 'bad'
              ? 'text-rose-600'
              : 'text-[#1d2d49]'
        }`}
      >
        {value}
      </div>

      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}

      {hint ? (
        <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
