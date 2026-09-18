import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

export const revalidate = 180;

export async function GET(
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

  // 8s: under Vercel's 10s function limit, so a dead backend yields a JSON
  // error the page can show instead of Vercel's FUNCTION_INVOCATION_TIMEOUT page.
  return proxyJson(
    `${apiBase}/clash/player/${encodeURIComponent(tag)}`,
    { headers: { 'x-api-key': apiKey, Accept: 'application/json' } },
    { timeoutMs: 8000 }
  );
}
