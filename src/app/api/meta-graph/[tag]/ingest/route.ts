import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

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

  return proxyJson(`${apiBase}/jeetio/meta-graph/${encodeURIComponent(tag)}/ingest`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    // The backend ignores the body, but Fastify rejects an empty body when the
    // content-type is application/json (FST_ERR_CTP_EMPTY_JSON_BODY), so send {}.
    body: '{}',
  });
}
