import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030611]/75 backdrop-blur-xl">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2 shadow-[0_0_20px_rgba(33,125,130,0.2)]">
              <Image src="/logo-wordmark.svg" alt="Findexio" width={240} height={69} priority className="h-auto w-[150px] sm:w-[240px]" />
            </div>
            <div className="hidden lg:block">
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#51c7e9]">Financial Intelligence</div>
              <div className="text-xs text-slate-300">Prvý slovenský open-source finančný index</div>
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          <a
            href="https://github.com/adamqqo/finance-rating-app"
            target="_blank"
            rel="noreferrer"
            className="no-underline rounded-full border border-[#51c7e9]/40 bg-[#51c7e9]/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#81d7ea] transition hover:border-[#51c7e9]/80 hover:text-white"
          >
            GitHub
          </a>
          <a
            href="/api/health"
            className="no-underline rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-200 transition hover:border-[#51c7e9]/60 hover:text-white"
          >
            API Health
          </a>
        </nav>
      </div>
    </header>
  );
}
