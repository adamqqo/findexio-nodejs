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
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:90px_90px] opacity-30" />
          <Header />
          <main className="container relative z-10 py-8 sm:py-10">{children}</main>
          <footer className="relative z-10 mt-10 border-t border-white/10">
            <div className="container flex flex-col gap-2 py-8 text-sm text-slate-300/80 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-semibold text-white">Findexio</span> · slovenský open-source finančný index
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Built for clarity in risk</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
