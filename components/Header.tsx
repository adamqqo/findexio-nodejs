import Image from 'next/image';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Top firmy', href: '/#top-firmy' },
  { label: 'Health API', href: '/api/health' }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-2 py-1 shadow-sm">
              <Image src="/logo.png" alt="Findexio" width={210} height={56} priority />
            </div>
            <div className="hidden lg:block text-xs text-slate-500">
              Slovenský open-source index finančnej kondície
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 no-underline transition hover:border-[#217d82]/40 hover:text-[#1d2d49]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
