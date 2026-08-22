/**
 * Structured logging — the single sink for every server-side log line.
 *
 * WHY THIS EXISTS: this app is a thin Next.js shell in front of an external backend
 * (API_BASE_URL). When something breaks, the question is almost always "was it us,
 * the network, or the backend?" — and stdout is the only place that can answer it.
 * So every line is ONE json object on ONE line with a greppable "[scope]" prefix,
 * which makes `vercel logs | grep '\[backend\]'` an actual debugging tool.
 *
 * SCOPES:
 *   [api]     route outcomes (route, status, ms, trace)
 *   [backend] upstream calls to API_BASE_URL (path, status, ms, err)
 *   [health]  diagnostics endpoint runs
 *
 * Lines carry a `trace` id when one is threaded through, so a single user action can
 * be reassembled from interleaved logs: `grep <trace>`.
 */

export type Scope = "api" | "backend" | "health";

/** Short correlation id. Not cryptographic — just enough to group log lines. */
export function newTrace(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Start a stopwatch. Call the returned fn for elapsed ms. */
export function stopwatch(): () => number {
  const t0 = Date.now();
  return () => Date.now() - t0;
}

/** Normalize any thrown value into a short, log-safe string. */
export function errText(e: unknown, max = 200): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`.slice(0, max);
  return String(e).slice(0, max);
}

/** Emit one structured line. Undefined fields are dropped so lines stay skimmable. */
export function log(scope: Scope, fields: Record<string, unknown>): void {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) clean[k] = v;
  console.log(`[${scope}]`, JSON.stringify(clean));
}
