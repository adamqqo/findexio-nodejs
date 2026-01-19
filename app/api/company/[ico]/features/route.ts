import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCompanyLatestFeatures, getCompanyIdentity } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ico: string }> }
) {
  const { ico } = await params;
  const identity = await getCompanyIdentity(ico);
  if (!identity) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const features = await getCompanyLatestFeatures(ico);
  return NextResponse.json({ ico, features });
}
