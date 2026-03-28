import type { MetadataRoute } from 'next';
import { getSitemapCompanyCount } from '@/lib/queries';

const BASE_URL = 'https://findexio.sk';
const CHUNK_SIZE = 50000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const companyCount = await getSitemapCompanyCount();
  const numberOfChunks = Math.ceil(companyCount / CHUNK_SIZE);

  const sitemaps: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1
    }
  ];

  // Add all company sitemap chunks
  for (let i = 0; i < numberOfChunks; i++) {
    sitemaps.push({
      url: `${BASE_URL}/company-sitemap/${i}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    });
  }

  return sitemaps;
}