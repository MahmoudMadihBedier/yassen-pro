import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updates = await request.json();
    try {
      const { db } = await connectToDatabase();
      await db.collection('checks').updateOne({ id }, { $set: updates });
      const updated = await db.collection('checks').findOne({ id });
      return NextResponse.json(updated || { ...updates, id });
    } catch (dbErr) {
      console.warn('PUT /api/checks/[id] warning - MongoDB unavailable:', (dbErr as Error).message);
      // Return the updates anyway; frontend will persist to localStorage
      return NextResponse.json({ ...updates, id });
    }
  } catch (err) {
    console.error('PUT /api/checks/[id] error', err);
    return NextResponse.json({ error: 'Failed to update check' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    try {
      const { db } = await connectToDatabase();
      await db.collection('checks').deleteOne({ id });
    } catch (dbErr) {
      console.warn('DELETE /api/checks/[id] warning - MongoDB unavailable:', (dbErr as Error).message);
      // Deletion signaled; frontend will remove from localStorage
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/checks/[id] error', err);
    return NextResponse.json({ error: 'Failed to delete check' }, { status: 400 });
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    try {
      const { db } = await connectToDatabase();
      const check = await db.collection('checks').findOne({ id });
      if (!check) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(check);
    } catch (dbErr) {
      console.warn('GET /api/checks/[id] warning - MongoDB unavailable:', (dbErr as Error).message);
      // Return 404 when DB unavailable; frontend should use localStorage
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (err) {
    console.error('GET /api/checks/[id] error', err);
    return NextResponse.json({ error: 'Failed to fetch check' }, { status: 400 });
  }
}
