import { NextResponse } from 'next/server';
import {
  getCompanyIdentity,
  getCompanyGrades,
  getCompanyFeatureSeries,
  getCompanyAggregateSeries
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ ico: string }> }) {
  const { ico: rawIco } = await params;
  const ico = (rawIco ?? '').toString().trim().replace(/[^0-9]/g, '');

  const identity = await getCompanyIdentity(ico);
  if (!identity) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [grades, featuresSeries,aggregates] = await Promise.all([
    getCompanyGrades(ico),
    getCompanyFeatureSeries(ico),
    getCompanyAggregateSeries(ico)
  ]);

  return NextResponse.json({
    ico,
    grades,
    featuresSeries,
    aggregates
  });
}
