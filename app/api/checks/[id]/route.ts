import { NextResponse } from 'next/server';

// Google Apps Script deployment URL
const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';

async function callAppsScript(method: string, path: string, body?: any) {
  if (!APPS_SCRIPT_URL) {
    return { error: 'Google Apps Script URL not configured' };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, path, body })
    });

    if (!response.ok) {
      throw new Error(`Apps Script error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Apps Script call failed:', err);
    throw err;
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!APPS_SCRIPT_URL) {
      console.error('GOOGLE_APPS_SCRIPT_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error: GOOGLE_APPS_SCRIPT_URL not set' },
        { status: 500 }
      );
    }
    
    const { id } = params;
    const updates = await request.json();
    const updated = await callAppsScript('PUT', `/checks/${id}`, updates);
    
    if (updated.error) {
      return NextResponse.json(updated, { status: 500 });
    }
    
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/checks/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update check' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!APPS_SCRIPT_URL) {
      console.error('GOOGLE_APPS_SCRIPT_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error: GOOGLE_APPS_SCRIPT_URL not set' },
        { status: 500 }
      );
    }
    
    const { id } = params;
    const result = await callAppsScript('DELETE', `/checks/${id}`);
    
    if (result.error) {
      return NextResponse.json(result, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('DELETE /api/checks/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete check' },
      { status: 500 }
    );
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!APPS_SCRIPT_URL) {
      console.error('GOOGLE_APPS_SCRIPT_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error: GOOGLE_APPS_SCRIPT_URL not set' },
        { status: 500 }
      );
    }
    
    const { id } = params;
    const check = await callAppsScript('GET', `/checks/${id}`);
    
    if (check.error) {
      return NextResponse.json(check, { status: 500 });
    }
    
    return NextResponse.json(check);
  } catch (err) {
    console.error('GET /api/checks/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch check' },
      { status: 500 }
    );
  }
}
