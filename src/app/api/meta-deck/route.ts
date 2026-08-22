import { NextResponse } from 'next/server';
import { proxyJson } from '@/lib/proxyJson';

// META LAB — premium meta-deck generator. The passcode lives in the client's
// localStorage and rides along as x-premium-key; this route only forwards it.
// The backend owns the check, so a wrong/missing key comes back as a 401 and a
// backend without the feature configured answers 503 — both pass through.
export const dynamic = 'force-dynamic';
// The backend call is retrieval + one Gemini generation — allow the full 60s
// (matches the proxyJson timeout below; without this Vercel's shorter function
// default kills the invocation and the client sees a bare non-JSON 504).
export const maxDuration = 60;

export async function POST(request: Request) {
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!apiBase || !apiKey) {
    return NextResponse.json(
      { error: 'Missing API_BASE_URL or API_KEY in environment.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const band = typeof body?.band === 'string' && body.band ? body.band : undefined;
  const latest = typeof body?.latest === 'boolean' ? body.latest : undefined;
  const focusCards = Array.isArray(body?.focusCards)
    ? body.focusCards.filter((c: unknown) => typeof c === 'string').slice(0, 3)
    : undefined;

  const premiumKey = request.headers.get('x-premium-key') ?? '';

  // The generator is LLM-backed and can take a while — give it more room than
  // proxyJson's 25s default, but still bounded so the page can't hang.
  return proxyJson(
    `${apiBase}/intel/meta-deck`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'x-premium-key': premiumKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ band, latest, focusCards }),
    },
    { timeoutMs: 60_000 }
  );
}
