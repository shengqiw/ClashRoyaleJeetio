import { NextRequest, NextResponse } from 'next/server';
import { errText, log, newTrace, stopwatch } from '@/lib/log';

/**
 * GET /api/health — the one call that explains the whole system.
 *
 * THIS ENDPOINT IS FOR WHOEVER DEBUGS THIS NEXT (human or Claude). Every route here
 * proxies to an external backend and fails in the same handful of ways; this answers,
 * without reading any source:
 *   - are API_BASE_URL / API_KEY actually set in this environment?
 *   - is the backend reachable, and how slow is it right now?
 *   - `warnings`: known-bad states, already diagnosed, in plain English
 *
 * Modes:
 *   GET /api/health            config only, zero upstream calls, instant
 *   GET /api/health?probe=1    also calls the backend's cheapest endpoint for real
 *
 * Never cached: a cached health check is a lie. Returns 503 when genuinely broken,
 * so it works as an uptime-monitor target as-is.
 */
export const dynamic = 'force-dynamic';

/** Every env var this app reads. Keep honest — it IS the env contract. */
const ENV_KEYS = ['API_BASE_URL', 'API_KEY'] as const;

/** Cheapest backend endpoint that needs no path params. */
const PROBE_PATH = '/clash/cards';
const PROBE_TIMEOUT_MS = 8_000;

export async function GET(req: NextRequest) {
  const trace = newTrace();
  const elapsed = stopwatch();
  const wantProbe = req.nextUrl.searchParams.get('probe') === '1';

  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const env = Object.fromEntries(ENV_KEYS.map((k) => [k, Boolean(process.env[k])]));

  const warnings: string[] = [];
  if (!apiBase) warnings.push('API_BASE_URL is not set — every /api/* route returns 500 "Missing API_BASE_URL or API_KEY".');
  if (!apiKey) warnings.push('API_KEY is not set — every /api/* route returns 500 "Missing API_BASE_URL or API_KEY".');

  let probe: { path: string; ok: boolean; status?: number; ms: number; detail?: string } | string =
    'not run — add ?probe=1';

  if (wantProbe) {
    if (!apiBase || !apiKey) {
      probe = { path: PROBE_PATH, ok: false, ms: 0, detail: 'skipped — API_BASE_URL/API_KEY missing' };
    } else {
      const t = stopwatch();
      try {
        const res = await fetch(`${apiBase}${PROBE_PATH}`, {
          headers: { 'x-api-key': apiKey, Accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        const ms = t();
        probe = { path: PROBE_PATH, ok: res.ok, status: res.status, ms };
        log('backend', { path: PROBE_PATH, status: res.status, ms, trace });
        if (!res.ok) warnings.push(`Backend answered ${res.status} on ${PROBE_PATH} — the backend is up but unhealthy.`);
        if (ms > 5_000) warnings.push(`Backend took ${ms}ms on its cheapest endpoint — routes using proxyJson (25s timeout) will feel hung.`);
      } catch (e) {
        const ms = t();
        probe = { path: PROBE_PATH, ok: false, ms, detail: errText(e) };
        log('backend', { path: PROBE_PATH, err: errText(e), ms, trace });
        warnings.push(
          `Backend unreachable at ${apiBase}${PROBE_PATH} (${errText(e, 80)}). ` +
            'If it is a cold container, retry once; if it stays down, every data page on the site is empty.'
        );
      }
    }
  }

  const ok = warnings.length === 0;
  log('health', { trace, mode: wantProbe ? 'probe' : 'config', ok, warnings: warnings.length, ms: elapsed() });

  return NextResponse.json(
    {
      ok,
      trace,
      checkedAt: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      ms: elapsed(),
      warnings,
      env,
      backend: { baseUrl: apiBase ?? null, probePath: PROBE_PATH, probeTimeoutMs: PROBE_TIMEOUT_MS },
      probe,
    },
    { status: ok ? 200 : 503 }
  );
}
