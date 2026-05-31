import { NextResponse } from 'next/server';

// Cards rarely change — cache for a day.
export const revalidate = 86400;

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
