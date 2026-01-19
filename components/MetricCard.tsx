export default function MetricCard({
  label,
  value,
  sub,
  info
}: {
  label: string;
  value: string;
  sub?: string;
  info?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-zinc-500">{label}</div>
        {info ? (
          <div className="group relative">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[11px] font-semibold text-zinc-600"
              aria-label="Info"
            >
              i
            </div>
            <div className="pointer-events-none absolute right-0 top-6 z-10 hidden w-72 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700 shadow-lg group-hover:block">
              <div className="font-medium text-zinc-900">Čo to znamená</div>
              <div className="mt-1 leading-relaxed text-zinc-700">{info}</div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}
