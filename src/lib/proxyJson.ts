import { NextResponse } from 'next/server';

/**
 * Proxy a JSON request to the backend API and return a NextResponse that is
 * ALWAYS valid JSON — even when the backend is slow, down, or replies with a
 * non-JSON body (a gateway timeout page, an empty 502, a refused connection).
 *
 * Without this guard the naive `await response.json()` throws inside the route
 * handler when the body isn't JSON; Next then returns an empty 500, and the
 * browser's `res.json()` fails with the cryptic
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 * A hung backend with no timeout also spins the client forever.
 *
 * @param url   Absolute backend URL to fetch.
 * @param init  Standard fetch init (method/headers/body).
 * @param opts.timeoutMs  Abort the request after this long (default 25s).
 */
export async function proxyJson(
  url: string,
  init: RequestInit = {},
  { timeoutMs = 25_000 }: { timeoutMs?: number } = {}
): Promise<NextResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: 'no-store', signal: controller.signal });
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted
          ? `Backend did not respond within ${Math.round(timeoutMs / 1000)}s — it may be unreachable. Try Refresh.`
          : `Could not reach backend: ${(err as Error).message}`,
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }

  // Read as text first so an empty / non-JSON body can't crash the handler.
  const text = await response.text();
  if (!text) {
    return NextResponse.json(
      { error: `Backend returned an empty response (HTTP ${response.status}).` },
      { status: response.status || 502 }
    );
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: response.status });
  } catch {
    return NextResponse.json(
      { error: `Backend returned a non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}` },
      { status: response.status >= 400 ? response.status : 502 }
    );
  }
}
