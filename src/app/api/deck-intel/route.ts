import { NextResponse } from 'next/server';

// Live semantic search against the ingested Path of Legend matchups.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const query = typeof body?.query === 'string' ? body.query : '';
  const topK = Number(body?.topK) || 6;
  const tag = typeof body?.tag === 'string' ? body.tag : undefined;
  // Trophy band ("low"|"mid"|"high"|"top") — optional; omitted means the
  // backend picks/ignores it. Passed straight through.
  const band = typeof body?.band === 'string' && body.band ? body.band : undefined;

  const url = `${apiBase}/intel/deck-counters`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, topK, tag, band }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
