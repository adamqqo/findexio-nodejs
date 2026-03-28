export default function GradeBadge({ grade }: { grade?: string | null }) {
  const g = (grade ?? '?').toUpperCase();

  const cls = (() => {
    switch (g) {
      case 'A':
        return 'border border-emerald-300/40 bg-emerald-400/15 text-emerald-200';
      case 'B':
        return 'border border-cyan-300/40 bg-cyan-400/15 text-cyan-200';
      case 'C':
        return 'border border-sky-300/40 bg-sky-400/15 text-sky-200';
      case 'D':
        return 'border border-yellow-300/40 bg-yellow-400/15 text-yellow-200';
      case 'E':
        return 'border border-orange-300/40 bg-orange-400/15 text-orange-200';
      case 'F':
        return 'border border-rose-300/40 bg-rose-400/15 text-rose-200';
      default:
        return 'border border-white/20 bg-white/10 text-white';
    }
  })();

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      Grade {g}
    </span>
  );
}
