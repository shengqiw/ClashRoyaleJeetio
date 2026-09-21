import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

// Request-time proxy; caching is done at the CDN via proxyJson's edgeCacheSeconds.
export const dynamic = 'force-dynamic';

export async function GET(
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

  // 8s: under Vercel's 10s function limit, so a dead backend yields a JSON
  // error the page can show instead of Vercel's FUNCTION_INVOCATION_TIMEOUT page.
  return proxyJson(
    `${apiBase}/clash/clan/${encodeURIComponent(tag)}/members`,
    { headers: { 'x-api-key': apiKey, Accept: 'application/json' } },
    { timeoutMs: 8000, edgeCacheSeconds: 120 }
  );
}
