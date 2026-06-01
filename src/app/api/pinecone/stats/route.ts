import { NextResponse } from 'next/server';

// Proxy route — fetch live Pinecone index stats at request time, never at build.
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const url = `${apiBase}/intel/pinecone/stats`;
  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
