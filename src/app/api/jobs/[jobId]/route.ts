import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

// Job status is live state — never cache it.
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  // A job lookup is a cheap map read; if the backend can't answer in 8s it's
  // momentarily busy (e.g. mid layer-3 crawl). Fail fast with a clean JSON 504
  // so the client can treat it as a transient blip and keep polling.
  return proxyJson(
    `${apiBase}/intel/jobs/${encodeURIComponent(jobId)}`,
    { headers: { 'x-api-key': apiKey, Accept: 'application/json' } },
    { timeoutMs: 8000 }
  );
}
