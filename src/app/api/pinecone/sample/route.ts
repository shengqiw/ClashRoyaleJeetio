import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

// Proxy route — sample a few records (id + metadata) from an index/namespace.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const incoming = new URL(request.url).searchParams;
  const index = incoming.get('index');
  if (!index) {
    return NextResponse.json(
      { error: 'index query parameter is required' },
      { status: 400 }
    );
  }

  const qs = new URLSearchParams({ index });
  // Forward namespace ("" = default) and limit when present.
  if (incoming.has('namespace')) qs.set('namespace', incoming.get('namespace') ?? '');
  if (incoming.get('limit')) qs.set('limit', incoming.get('limit') as string);

  return proxyJson(`${apiBase}/intel/pinecone/sample?${qs.toString()}`, {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' },
  });
}
