import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const checks = await db.collection('checks').find({}).toArray();
    return NextResponse.json(checks);
  } catch (err) {
    console.warn('GET /api/checks warning - MongoDB unavailable, returning empty array:', (err as Error).message);
    // Return empty array to signal localStorage should be used
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    try {
      const { db } = await connectToDatabase();
      await db.collection('checks').insertOne(body);
    } catch (dbErr) {
      console.warn('POST /api/checks warning - MongoDB unavailable:', (dbErr as Error).message);
      // Fall through: return the data anyway, frontend will persist to localStorage
    }
    return NextResponse.json(body, { status: 201 });
  } catch (err) {
    console.error('POST /api/checks error', err);
    return NextResponse.json({ error: 'Failed to create check' }, { status: 400 });
  }
}
