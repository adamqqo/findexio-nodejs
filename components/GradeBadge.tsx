export default function GradeBadge({ grade }: { grade?: string | null }) {
  const g = (grade ?? '?').toUpperCase();

  const cls = (() => {
    switch (g) {
      case 'A':
        return 'border-emerald-300 bg-emerald-50 text-emerald-700';
      case 'B':
        return 'border-teal-300 bg-teal-50 text-teal-700';
      case 'C':
        return 'border-sky-300 bg-sky-50 text-sky-700';
      case 'D':
        return 'border-amber-300 bg-amber-50 text-amber-700';
      case 'E':
        return 'border-orange-300 bg-orange-50 text-orange-700';
      case 'F':
        return 'border-rose-300 bg-rose-50 text-rose-700';
      default:
        return 'border-slate-300 bg-white text-slate-700';
    }
  })();

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${cls}`}
    >
      Grade {g}
    </span>
  );
}
