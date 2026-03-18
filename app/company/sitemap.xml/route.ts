import { getSitemapCompanyCount } from '@/lib/queries';

const BASE_URL = 'https://findexio-nodejs-production.up.railway.app';
const CHUNK_SIZE = 50000;

export async function GET() {
  const total = await getSitemapCompanyCount();
  const pages = Math.ceil(total / CHUNK_SIZE);
  const now = new Date().toISOString();

  const companySitemaps = Array.from({ length: pages }, (_, i) => {
    return `
      <sitemap>
        <loc>${BASE_URL}/company/sitemap/${i}.xml</loc>
        <lastmod>${now}</lastmod>
      </sitemap>
    `;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  ${companySitemaps}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}