import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Findexio" width={256} height={68} priority />
            <div className="hidden sm:block text-xs text-zinc-500">
              Prvý slovenský open-source index finančného zdravia firiem
            </div>
          </div>
        </Link>
        <nav className="text-sm text-zinc-600">
          <a href="/api/health" className="no-underline text-zinc-600 hover:text-zinc-900">
            health
          </a>
        </nav>
      </div>
    </header>
  );
}
