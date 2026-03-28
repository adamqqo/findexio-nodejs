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
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(33,125,130,0.09),transparent_55%)]" />
        <Header />
        <main className="container py-8 md:py-10">{children}</main>
        <footer className="mt-10 border-t border-slate-200/70 bg-white/60 backdrop-blur">
          <div className="container flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-slate-500">
            <span className="font-semibold text-[#1d2d49]">Findexio</span>
            <span>Open-source finančný index • demo</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
