import type { MetadataRoute } from 'next';
import { getSitemapCompanyCount } from '@/lib/queries';

const BASE_URL = 'https://findexio.sk';
const CHUNK_SIZE = 50000;

function baseSitemap(now: Date): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1
    }
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  try {
    const companyCount = await getSitemapCompanyCount();
    const numberOfChunks = Math.ceil(companyCount / CHUNK_SIZE);

    const sitemaps = baseSitemap(now);

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
  } catch (error) {
    console.warn('Sitemap DB lookup failed, returning base sitemap only.', error);
    return baseSitemap(now);
  }
}
