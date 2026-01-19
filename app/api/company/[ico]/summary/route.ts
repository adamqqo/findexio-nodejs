import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCompanyGrades, getCompanyIdentity } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ico: string }> }) {
  const { ico } = await params;
  const identity = await getCompanyIdentity(ico);
  if (!identity) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const grades = await getCompanyGrades(ico);
  const latest = grades.length ? grades[grades.length - 1] : null;

  return NextResponse.json({ identity, latest, grades });
}
