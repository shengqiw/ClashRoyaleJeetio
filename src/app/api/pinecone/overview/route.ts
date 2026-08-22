import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

// Proxy route — fetch the live cross-index Pinecone overview at request time.
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

  // The admin passcode lives in the browser and rides along per request; the
  // backend owns the check and answers 401. API_KEY alone must never be enough.
  return proxyJson(`${apiBase}/intel/pinecone/overview`, {
    headers: {
      'x-api-key': apiKey,
      'x-admin-key': request.headers.get('x-admin-key') ?? '',
      Accept: 'application/json',
    },
  });
}
