import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updates = await request.json();
    const { db } = await connectToDatabase();
    // Update by MongoDB _id (ObjectId) when possible
    const query: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await db.collection('checks').updateOne(query, { $set: updates });
    const updated = await db.collection('checks').findOne(query);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { _id, ...rest } = updated as any;
    return NextResponse.json({ ...rest, _id });
  } catch (err) {
    console.error('PUT /api/checks/[id] error', err);
    const msg = (err as Error).message || 'Failed to update check';
    const status = msg.includes('MONGODB_URI') || msg.includes('Mongo') ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    // Delete by MongoDB _id (ObjectId) when possible
    const queryDel: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await db.collection('checks').deleteOne(queryDel);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/checks/[id] error', err);
    const msg = (err as Error).message || 'Failed to delete check';
    const status = msg.includes('MONGODB_URI') || msg.includes('Mongo') ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    const queryGet: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const check = await db.collection('checks').findOne(queryGet);
    if (!check) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { _id, ...rest } = check as any;
    return NextResponse.json({ ...rest, id: String(_id) });
  } catch (err) {
    console.error('GET /api/checks/[id] error', err);
    const msg = (err as Error).message || 'Failed to fetch check';
    const status = msg.includes('MONGODB_URI') || msg.includes('Mongo') ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
