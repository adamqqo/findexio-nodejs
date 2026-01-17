import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Findexio',
  description: 'Hodnotenie firiem na zaklade uctovnych zavierok.'
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
            <span className="font-medium text-zinc-700">Findexio</span> • internal demo
          </div>
        </footer>
      </body>
    </html>
  );
}
