import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

// Best-effort self-heal: ask the backend to restart its own process (Docker's
// --restart policy brings it back). The admin page calls this after a sustained
// run of failed polls suggests the backend is overloaded/wedged.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  // Short timeout: if the box is too wedged to answer in ~5s the restart isn't
  // landing anyway, and we don't want to hang the admin UI waiting on it.
  return proxyJson(
    `${apiBase}/jeetio/restart`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        // Admin passcode from the browser — restarting is gated on it (401).
        'x-admin-key': request.headers.get('x-admin-key') ?? '',
        Accept: 'application/json',
      },
    },
    { timeoutMs: 5000 }
  );
}
