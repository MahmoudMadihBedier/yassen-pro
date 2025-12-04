import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const checks = await db.collection('checks').find({}).toArray();
    // Map _id back to id for frontend compatibility
    const mapped = checks.map(doc => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { _id, ...rest } = doc as any;
      return { ...rest, _id };
    });
    return NextResponse.json(mapped);
  } catch (err) {
    console.error('GET /api/checks error - MongoDB unavailable:', (err as Error).message);
    // Fail loudly so clients know the database is required
    return NextResponse.json({ error: 'MongoDB unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('POST /api/checks - JSON parse error:', (parseErr as Error).message);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    // Use id as _id for MongoDB (avoids duplicate key errors)
    const docToInsert = { ...body, _id: body.id };
    const result = await db.collection('checks').insertOne(docToInsert);
    return NextResponse.json({ ...body, _id: result.insertedId }, { status: 201 });
  } catch (err) {
    console.error('POST /api/checks error', err);
    const msg = (err as Error).message || 'Failed to create check';
    // Differentiate DB unavailable vs validation/insert error
    const status = msg.includes('MONGODB_URI') || msg.includes('Mongo') ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
