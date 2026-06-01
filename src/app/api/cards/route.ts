import { NextResponse } from 'next/server';

// Proxy route — must run at request time, not during the build. Without this,
// Next.js prerenders it at build and tries to reach the backend (which isn't
// available in CI), failing the build. The upstream fetch below still caches
// the card data for a day via `next: { revalidate }`.
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

  const url = `${apiBase}/clash/cards`;
  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
    next: { revalidate: 86400 },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
