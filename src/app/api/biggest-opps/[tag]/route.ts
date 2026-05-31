import { NextResponse } from 'next/server';

export const revalidate = 180;

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

  const wantsStream =
    new URL(request.url).searchParams.get('stream') === 'true';

  // ── Streaming (SSE) — used by the Deck AI page ──
  if (wantsStream) {
    const sseHeaders = {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    };

    const url = `${apiBase}/jeetio/biggest-opps/${encodeURIComponent(
      tag
    )}?limit=25&stream=true`;
    const upstream = await fetch(url, {
      headers: { 'x-api-key': apiKey, Accept: 'text/event-stream' },
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      const payload = await upstream.json().catch(() => ({}));
      return NextResponse.json(payload, { status: upstream.status });
    }

    const upstreamType = upstream.headers.get('content-type') || '';

    // Backend supports SSE — relay the event-stream straight to the browser.
    if (upstreamType.includes('text/event-stream')) {
      return new Response(upstream.body, { status: 200, headers: sseHeaders });
    }

    // Older / non-streaming backend: it answered with one buffered JSON blob.
    // Adapt it into the same SSE shape so the page renders regardless. (Deploy
    // the streaming backend to get true token-by-token analysis.)
    const json = await upstream.json().catch(() => null);
    const encoder = new TextEncoder();
    const frame = (event: string, data: unknown) =>
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const stream = new ReadableStream({
      start(controller) {
        if (!json) {
          controller.enqueue(
            frame('error', { message: 'Malformed upstream response' })
          );
        } else {
          const { analysis, deckSuggestions, ...opps } = json;
          controller.enqueue(frame('opps', opps));
          if (analysis) controller.enqueue(frame('analysis', { text: analysis }));
          if (deckSuggestions)
            controller.enqueue(frame('decks', { decks: deckSuggestions }));
          controller.enqueue(frame('done', { ok: true }));
        }
        controller.close();
      },
    });

    return new Response(stream, { status: 200, headers: sseHeaders });
  }

  // ── Default: buffered JSON (unchanged contract) ──
  const url = `${apiBase}/jeetio/biggest-opps/${encodeURIComponent(tag)}?limit=25`;
  console.log(`Fetching biggest opportunities for tag: ${tag} from ${url}`);
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
