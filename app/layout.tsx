import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://finance-rating-app.vercel.app'),
  title: 'Findexio',
  description: 'Hodnotenie finančného zdravia slovenských firiem.',
  applicationName: 'Findexio',
  icons: {
    icon: [
      { url: '/logo-mark.svg', type: 'image/svg+xml' }
    ],
    shortcut: ['/logo-mark.svg'],
    apple: [{ url: '/logo-mark.svg', sizes: '180x180', type: 'image/svg+xml' }]
  },
  openGraph: {
    title: 'Findexio',
    description: 'Hodnotenie finančného zdravia slovenských firiem.',
    images: [{ url: '/logo-mark.svg', width: 512, height: 512, alt: 'Findexio logo' }]
  },
  twitter: {
    card: 'summary',
    title: 'Findexio',
    description: 'Hodnotenie finančného zdravia slovenských firiem.',
    images: ['/logo-mark.svg']
  }
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Findexio',
  url: 'https://github.com/adamqqo/finance-rating-app',
  logo: 'https://github.com/adamqqo/finance-rating-app/raw/main/public/logo-mark.svg'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="findexio-theme";var s=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s||(d?"dark":"light");document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <div className="aurora aurora-top" aria-hidden />
        <div className="aurora aurora-bottom" aria-hidden />

        <Header />

        <main className="container py-8 sm:py-12">{children}</main>

        <footer className="border-t border-slate-900/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-[#040710]/80">
          <div className="container flex flex-col gap-2 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
            <span>
              <span className="font-semibold text-slate-900 dark:text-white">Findexio</span> • Open-source finančný index
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#217d82] dark:text-[#51c7e9]">Built for smarter decisions</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
