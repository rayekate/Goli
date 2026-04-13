import { NextResponse } from 'next/server';
import { getPriceData } from '@/lib/gold-price';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getPriceData();
  return NextResponse.json(data);
}
