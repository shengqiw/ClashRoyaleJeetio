import { NextResponse } from 'next/server';

// Long-running: scans many battle logs and embeds them. No caching.
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // allow up to 5 min on platforms that honor it

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const { locationId } = await params;
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const limit = Number(body?.limit) || 50;

  const url = `${apiBase}/intel/pathoflegend/${encodeURIComponent(locationId)}/ingest`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ limit }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
