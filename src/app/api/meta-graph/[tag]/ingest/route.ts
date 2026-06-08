import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

// Fire-and-forget: kicks off the 3-layer battle-graph crawl on the backend and
// returns a job id immediately. The admin page polls /api/jobs/[jobId] for
// progress and the final summary (which includes the per-player index name).
export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
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

  // Route through proxyJson so a busy/down backend (which can happen mid-crawl)
  // returns a clean JSON error instead of a non-JSON page that makes the
  // client's startRes.json() throw "Unexpected token 'A'…".
  return proxyJson(
    `${apiBase}/jeetio/meta-graph/${encodeURIComponent(tag)}/ingest`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // Backend ignores the body, but Fastify rejects an empty JSON body, so {}.
      body: '{}',
    },
    { timeoutMs: 15000 }
  );
}
