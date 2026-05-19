import { NextResponse } from 'next/server';

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

  const url = `${apiBase}/clan/${encodeURIComponent(tag)}/members`;
  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
