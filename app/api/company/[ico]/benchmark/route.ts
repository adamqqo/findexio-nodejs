import { NextResponse } from 'next/server';
import { getCompanyBenchmark } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ ico: string }> }) {
  const { ico: rawIco } = await params;
  const ico = (rawIco ?? '').toString().trim().replace(/[^0-9]/g, '');

  const { searchParams } = new URL(req.url);

  const fiscalYear = searchParams.get('year')
    ? Number(searchParams.get('year'))
    : undefined;

  const geoLevelRaw = searchParams.get('geo');
  const sectorLevelRaw = searchParams.get('sector');

  const geoLevel =
    geoLevelRaw === 'country' || geoLevelRaw === 'kraj' || geoLevelRaw === 'okres'
      ? geoLevelRaw
      : undefined;

  const sectorLevel =
    sectorLevelRaw === 'nace_division' || sectorLevelRaw === 'main_activity_code_id'
      ? sectorLevelRaw
      : undefined;

  const data = await getCompanyBenchmark(ico, {
    fiscalYear,
    geoLevel,
    sectorLevel
  });

  if (!data) {
    return NextResponse.json({ error: 'Benchmark not available' }, { status: 404 });
  }

  return NextResponse.json(data);
}