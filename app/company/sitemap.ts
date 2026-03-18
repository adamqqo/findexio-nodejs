import type { MetadataRoute } from 'next';
import { getSitemapCompanyCount, getSitemapCompanies } from '@/lib/queries';

const BASE_URL = 'https://findexio.sk';
const CHUNK_SIZE = 50000;

export async function generateSitemaps() {
  const total = await getSitemapCompanyCount();
  const pages = Math.ceil(total / CHUNK_SIZE);

  return Array.from({ length: pages }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const idRaw = await props.id;
  const id = Number(idRaw);

  const offset = id * CHUNK_SIZE;
  const companies = await getSitemapCompanies(CHUNK_SIZE, offset);
  const now = new Date();

  return companies.map((company) => ({
    url: `${BASE_URL}/company/${company.ico}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7
  }));
}