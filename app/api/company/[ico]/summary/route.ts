import { NextResponse } from 'next/server';
import { getCompanyGrades, getCompanyIdentity } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { ico: string } }) {
  const ico = params.ico;
  const identity = await getCompanyIdentity(ico);
  if (!identity) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const grades = await getCompanyGrades(ico);
  const latest = grades.length ? grades[grades.length - 1] : null;

  return NextResponse.json({ identity, latest, grades });
}
