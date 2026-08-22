/**
 * Structured logging — the single sink for every server-side log line.
 *
 * WHY THIS EXISTS: a future Claude session debugging this app has no debugger and
 * no APM. All it gets is stdout. So every line is ONE json object on ONE line with
 * a greppable "[scope]" prefix, which means `npm run dev 2>&1 | grep '\[clash\]'`
 * (or Vercel's log search) is a real debugging tool.
 *
 * CONTRACT — do not break these, CLAUDE.md documents them:
 *   [clash]  data-path attempts (proxy vs legacy, status, ms)
 *   [llm]    LLM provider attempts (provider, model, ok, ms, status, err)
 *   [api]    route entry/exit (route, status, ms, trace)
 *   [health] diagnostics endpoint probes
 *
 * Every line carries `trace` when a request id is threaded through, so one user
 * action can be reassembled from interleaved logs.
 */

export type Scope = "clash" | "llm" | "api" | "health" | "insight";

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
