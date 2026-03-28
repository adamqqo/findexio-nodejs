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
        <Header />
        <main className="container py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-200">
          <div className="container py-6 text-sm text-zinc-500">
            <span className="font-medium text-zinc-700">Findexio</span> • demo
          </div>
        </footer>
      </body>
    </html>
  );
}
