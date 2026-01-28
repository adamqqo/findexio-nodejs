import { NextResponse } from 'next/server';
import {
  getCompanyIdentity,
  getCompanyGrades,
  getCompanyFeatureSeries
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ ico: string }> }) {
  const { ico: rawIco } = await params;
  const ico = (rawIco ?? '').toString().trim().replace(/[^0-9]/g, '');

  const identity = await getCompanyIdentity(ico);
  if (!identity) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [grades, featuresSeries] = await Promise.all([
    getCompanyGrades(ico),
    getCompanyFeatureSeries(ico)
  ]);

  return NextResponse.json({
    ico,
    grades,
    featuresSeries
  });
}
