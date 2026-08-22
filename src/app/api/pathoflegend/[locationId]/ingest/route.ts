import { NextResponse } from 'next/server';

// Fire-and-forget: this just kicks off a background job on the backend and
// returns a job id immediately, so it stays well under any serverless limit.
// The admin page polls /api/jobs/[jobId] for progress and the final summary.
export const dynamic = 'force-dynamic';

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
      // Admin passcode from the browser — the backend gates ingest on it.
      'x-admin-key': request.headers.get('x-admin-key') ?? '',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ limit }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
