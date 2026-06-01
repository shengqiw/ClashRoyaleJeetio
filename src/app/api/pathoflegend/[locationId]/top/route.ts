import { NextResponse } from 'next/server';

export const revalidate = 180;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const { locationId } = await params;
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const limit = new URL(request.url).searchParams.get('limit') ?? '50';
  const url = `${apiBase}/intel/pathoflegend/${encodeURIComponent(locationId)}/top?limit=${encodeURIComponent(limit)}`;
  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
    next: { revalidate: 180 },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
