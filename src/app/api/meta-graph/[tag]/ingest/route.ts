import { NextResponse } from 'next/server';

// Fire-and-forget: kicks off the 3-layer battle-graph crawl on the backend and
// returns a job id immediately. The admin page polls /api/jobs/[jobId] for
// progress and the final summary (which includes the per-player index name).
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const url = `${apiBase}/jeetio/meta-graph/${encodeURIComponent(tag)}/ingest`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
