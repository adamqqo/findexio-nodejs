import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#030611]/75">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-wordmark.svg"
              alt="Findexio"
              width={1180}
              height={320}
              priority
              className="h-auto w-[190px] max-w-[56vw] object-contain sm:w-[260px] lg:w-[360px]"
            />
            <div className="hidden lg:block">
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#217d82] dark:text-[#51c7e9]">Transparency, Valuability, Simplicity</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Prvý slovenský open-source finančný index</div>
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          <ThemeToggle />
          <a
            href="https://github.com/adamqqo/finance-rating-app"
            target="_blank"
            rel="noreferrer"
            className="no-underline rounded-full border border-[#51c7e9]/40 bg-[#51c7e9]/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#217d82] transition hover:border-[#51c7e9]/80 dark:text-[#81d7ea]"
          >
            GitHub
          </a>
          <a
            href="/api/health"
            className="no-underline rounded-full border border-slate-900/15 bg-slate-900/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700 transition hover:border-[#51c7e9]/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:text-white"
          >
            API Health
          </a>
        </nav>
      </div>
    </header>
  );
}
