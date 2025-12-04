import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const checks = await db.collection('checks').find({}).toArray();
    return NextResponse.json(checks);
  } catch (err) {
    console.error('GET /api/checks error - MongoDB unavailable:', (err as Error).message);
    // Fail loudly so clients know the database is required
    return NextResponse.json({ error: 'MongoDB unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    await db.collection('checks').insertOne(body);
    return NextResponse.json(body, { status: 201 });
  } catch (err) {
    console.error('POST /api/checks error', err);
    // Differentiate DB unavailable vs bad request
    const msg = (err as Error).message || 'Failed to create check';
    const status = msg.includes('MONGODB_URI') || msg.includes('Mongo') ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
