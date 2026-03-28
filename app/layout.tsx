import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Findexio',
  description: 'Hodnotenie finančného zdravia slovenských firiem.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>
        <div className="aurora aurora-top" aria-hidden />
        <div className="aurora aurora-bottom" aria-hidden />

        <Header />

        <main className="container py-8 sm:py-12">{children}</main>

        <footer className="border-t border-white/10 bg-[#040710]/80 backdrop-blur">
          <div className="container flex flex-col gap-2 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <span className="font-semibold text-white">Findexio</span> • Open-source finančný index
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#51c7e9]">Built for smarter decisions</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
