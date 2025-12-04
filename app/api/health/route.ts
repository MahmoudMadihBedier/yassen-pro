import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    // ping the server
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).command({ ping: 1 });
    return NextResponse.json({ ok: true, db: process.env.MONGODB_DB || 'yassen-pro' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
