export default function GradeBadge({ grade }: { grade?: string | null }) {
  const g = (grade ?? '?').toUpperCase();

  const cls = (() => {
    switch (g) {
      case 'A':
        return 'bg-zinc-900 text-white';
      case 'B':
        return 'bg-zinc-800 text-white';
      case 'C':
        return 'bg-zinc-700 text-white';
      case 'D':
        return 'bg-zinc-600 text-white';
      case 'E':
        return 'bg-zinc-500 text-white';
      case 'F':
        return 'bg-zinc-950 text-white';
      default:
        return 'bg-white text-zinc-900 border border-zinc-300';
    }
  })();

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      Grade {g}
    </span>
  );
}
