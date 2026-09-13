/**
 * Gemini wrapper — server-side only (route handlers). Mirrors the backend's
 * own Gemini usage (/intel/meta-deck) but lives here because the War Decks
 * route runs in this app, not on the GCP backend.
 *
 * Design rules, all in service of the $0 rule and of never blocking a page:
 *   - Free-tier AI Studio key (`GEMINI_API_KEY`), REST only — no SDK, nothing
 *     added to the client bundle. Model via `GEMINI_MODEL` (default
 *     gemini-3.6-flash, with a 404 fallback chain; thinking is set to the
 *     minimum because the prompts are "judge these candidates", not "solve this").
 *   - Structured output: every call passes a JSON schema and parses the reply
 *     strictly. Callers get a typed object or `null` + a reason — never a throw.
 *   - Hard timeout (default 20s) so a slow model can't hold a Vercel function.
 *   - 429/5xx are reported, not retried: the free tier's per-minute cap means a
 *     retry storm just burns the day's quota.
 */
import { errText, log, stopwatch } from "./log";

const DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
// Google retires model ids for new keys (gemini-2.5-flash 404'd "no longer
// available to new users" on 2026-09-13, pointing at 3.6). The primary is
// overridable with GEMINI_MODEL; on a 404 we walk this list so one stale id
// never takes the feature down. `gemini-flash-latest` is Google's moving alias.
const DEFAULT_MODEL = "gemini-3.6-flash";
const FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash"];

/** Override only for local testing against a mock (see eval/mock-backend.mjs). */
const endpoint = () => process.env.GEMINI_API_BASE || DEFAULT_ENDPOINT;

/**
 * Thinking is a cost/latency knob, and the parameter name changed between
 * generations: 2.5 takes `thinkingBudget`, 3.x takes `thinkingLevel`. These
 * prompts are "judge these candidates", not "solve this", so the lowest
 * setting is right. Unknown families get nothing (the API 400s on a wrong key).
 */
function thinkingConfig(model: string): Record<string, unknown> | undefined {
  if (/^gemini-2\.5/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-3/.test(model)) return { thinkingLevel: "low" };
  return undefined;
}

/** Minimal OpenAPI-style schema accepted by Gemini's `responseSchema`. */
export type GeminiSchema = {
  type: "OBJECT" | "ARRAY" | "STRING" | "INTEGER" | "NUMBER" | "BOOLEAN";
  description?: string;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
  enum?: string[];
  nullable?: boolean;
};

export type GeminiJsonResult<T> =
  | { ok: true; data: T; model: string; ms: number }
  | { ok: false; reason: string; model: string; ms: number; status?: number };

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function geminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * One structured-output generation. `system` frames the task, `prompt` carries
 * the data, `schema` shapes the reply. Returns parsed JSON typed as T.
 */
export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  schema: GeminiSchema;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  trace?: string;
}): Promise<GeminiJsonResult<T>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, reason: "GEMINI_API_KEY not set", model: geminiModel(), ms: 0 };

  // Primary model first, then the fallbacks (deduped) — but only a 404
  // ("model retired") moves down the list; quota/timeouts/etc. return at once.
  const models = [geminiModel(), ...FALLBACK_MODELS].filter((m, i, a) => a.indexOf(m) === i);
  let last: GeminiJsonResult<T> | null = null;
  for (const model of models) {
    last = await callModel<T>(model, key, opts);
    if (last.ok || last.status !== 404) return last;
    log("backend", { path: "gemini", model, err: "model unavailable — trying next", trace: opts.trace });
  }
  return last as GeminiJsonResult<T>;
}

async function callModel<T>(
  model: string,
  key: string,
  opts: Parameters<typeof generateJson>[0],
  withThinking = true
): Promise<GeminiJsonResult<T>> {
  const t = stopwatch();
  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    responseSchema: opts.schema,
    temperature: opts.temperature ?? 0.4,
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
  };
  const thinking = withThinking ? thinkingConfig(model) : undefined;
  if (thinking) generationConfig.thinkingConfig = thinking;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20_000);
  try {
    const res = await fetch(`${endpoint()}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    const ms = t();
    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 200);
      try {
        detail = JSON.parse(text)?.error?.message?.slice(0, 200) ?? detail;
      } catch {
        /* keep raw */
      }
      log("backend", { path: "gemini", model, status: res.status, ms, err: detail, trace: opts.trace });
      // A 400 about the thinking parameter means this model wants the other
      // spelling (or none) — retry once bare rather than fail the request.
      if (res.status === 400 && thinking && /thinking/i.test(detail)) {
        clearTimeout(timer);
        return callModel<T>(model, key, opts, false);
      }
      const reason =
        res.status === 429
          ? "Gemini free-tier quota hit — try again in a minute"
          : `Gemini answered ${res.status}: ${detail}`;
      return { ok: false, reason, model, ms, status: res.status };
    }
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return { ok: false, reason: "Gemini returned non-JSON", model, ms, status: res.status };
    }
    const p = payload as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      promptFeedback?: { blockReason?: string };
    };
    const raw = p.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
    if (!raw) {
      const why = p.promptFeedback?.blockReason || p.candidates?.[0]?.finishReason || "empty reply";
      log("backend", { path: "gemini", model, status: res.status, ms, err: why, trace: opts.trace });
      return { ok: false, reason: `Gemini gave no answer (${why})`, model, ms, status: res.status };
    }
    try {
      const data = JSON.parse(raw) as T;
      log("backend", { path: "gemini", model, status: res.status, ms, trace: opts.trace });
      return { ok: true, data, model, ms };
    } catch {
      return { ok: false, reason: "Gemini reply was not valid JSON", model, ms, status: res.status };
    }
  } catch (e) {
    const ms = t();
    const aborted = (e as Error)?.name === "AbortError";
    log("backend", { path: "gemini", model, ms, err: aborted ? "timeout" : errText(e), trace: opts.trace });
    return { ok: false, reason: aborted ? "Gemini timed out" : `Gemini unreachable: ${errText(e, 80)}`, model, ms };
  } finally {
    clearTimeout(timer);
  }
}
