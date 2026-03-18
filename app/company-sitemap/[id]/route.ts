import { getSitemapCompanies, getSitemapCompanyCount } from '@/lib/queries';

const BASE_URL = 'https://findexio.sk';
const CHUNK_SIZE = 50000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 0) {
    return new Response('Invalid sitemap id', { status: 400 });
  }

  const total = await getSitemapCompanyCount();
  const maxId = Math.max(0, Math.ceil(total / CHUNK_SIZE) - 1);

  if (id > maxId) {
    return new Response('Sitemap not found', { status: 404 });
  }

  const offset = id * CHUNK_SIZE;
  const companies = await getSitemapCompanies(CHUNK_SIZE, offset);
  const now = new Date().toISOString();

  const urls = companies
    .map(
      (company) => `
  <url>
    <loc>${BASE_URL}/company/${company.ico}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}