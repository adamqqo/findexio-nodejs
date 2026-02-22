// app/api/top-companies/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = getPool();

    const sql = `SELECT * FROM core.mv_top10_by_grade_year WHERE fiscal_year = 2024;`;

    const res = await pool.query(sql);
    return NextResponse.json({ items: res.rows ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
