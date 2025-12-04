import { NextResponse } from 'next/server';

// Google Apps Script deployment URL (you'll set this in .env)
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

export async function GET() {
  try {
    const checks = await callAppsScript('GET', '/checks');
    return NextResponse.json(checks);
  } catch (err) {
    console.error('GET /api/checks error:', err);
    return NextResponse.json({ error: 'Failed to fetch checks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const check = await callAppsScript('POST', '/checks', body);
    
    if (check.error) {
      return NextResponse.json(check, { status: 400 });
    }
    
    return NextResponse.json(check, { status: 201 });
  } catch (err) {
    console.error('POST /api/checks error:', err);
    return NextResponse.json({ error: 'Failed to create check' }, { status: 500 });
  }
}

