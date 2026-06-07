import { NextResponse } from 'next/server';

// Delete a Pinecone index by exact name. Proxies to backend
// DELETE /intel/pinecone/index/:name.
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const url = `${apiBase}/intel/pinecone/index/${encodeURIComponent(name)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'x-api-key': apiKey, Accept: 'application/json' },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
