import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030611]/75 backdrop-blur-xl">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2 shadow-[0_0_20px_rgba(33,125,130,0.2)]">
              <Image src="/logo.png" alt="Findexio" width={150} height={40} priority className="h-auto w-[112px] sm:w-[150px]" />
            </div>
            <div className="hidden sm:block">
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#51c7e9]">Financial Intelligence</div>
              <div className="text-xs text-slate-300">Prvý slovenský open-source finančný index</div>
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <a
            href="/api/health"
            className="no-underline rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-200 transition hover:border-[#51c7e9]/60 hover:text-white"
          >
            API Health
          </a>
        </nav>
      </div>
    </header>
  );
}
