import { NextResponse } from 'next/server';
import { getCompanyLatestFeatures, getCompanyIdentity } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { ico: string } }) {
  const ico = params.ico;
  const identity = await getCompanyIdentity(ico);
  if (!identity) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const features = await getCompanyLatestFeatures(ico);
  return NextResponse.json({ ico, features });
}
