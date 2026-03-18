import type { MetadataRoute } from 'next';

const BASE_URL = 'https://findexio.sk';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/company/sitemap/0.xml`
    ],
    host: BASE_URL
  };
}