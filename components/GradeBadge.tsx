export default function GradeBadge({ grade }: { grade?: string | null }) {
  const g = (grade ?? '?').toUpperCase();

  const cls = (() => {
    switch (g) {
      case 'A':
        return 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-400/15 dark:text-emerald-200';
      case 'B':
        return 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-800 dark:border-cyan-300/40 dark:bg-cyan-400/15 dark:text-cyan-200';
      case 'C':
        return 'border border-sky-400/50 bg-sky-500/20 text-sky-800 dark:border-sky-300/40 dark:bg-sky-400/15 dark:text-sky-200';
      case 'D':
        return 'border border-yellow-400/60 bg-yellow-400/25 text-yellow-900 dark:border-yellow-300/40 dark:bg-yellow-400/15 dark:text-yellow-200';
      case 'E':
        return 'border border-orange-400/60 bg-orange-400/25 text-orange-900 dark:border-orange-300/40 dark:bg-orange-400/15 dark:text-orange-200';
      case 'F':
        return 'border border-rose-400/60 bg-rose-500/20 text-rose-900 dark:border-rose-300/40 dark:bg-rose-400/15 dark:text-rose-200';
      default:
        return 'border border-slate-400/40 bg-slate-900/5 text-slate-800 dark:border-white/20 dark:bg-white/10 dark:text-white';
    }
  })();

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      Grade {g}
    </span>
  );
}
