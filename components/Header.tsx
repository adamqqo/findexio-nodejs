import Image from 'next/image';
import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/#vyhladavanie', label: 'Vyhľadávanie' },
  { href: '/#top-firmy', label: 'Top firmy' },
  { href: '/api/health', label: 'API Health' }
];

export default function Header() {
  return (
    <header className="relative z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Findexio" width={188} height={50} priority className="h-auto w-[150px] sm:w-[188px]" />
            <div className="hidden rounded-full border border-cyan-300/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-200 lg:block">
              Finance Intelligence
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-200/90">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 no-underline transition hover:border-cyan-300/40 hover:bg-cyan-500/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
