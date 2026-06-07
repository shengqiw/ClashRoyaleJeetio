import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

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

  return proxyJson(`${apiBase}/intel/pinecone/index/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: { 'x-api-key': apiKey, Accept: 'application/json' },
  });
}
