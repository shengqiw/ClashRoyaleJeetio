/**
 * Gemini wrapper — server-side only (route handlers). Mirrors the backend's
 * own Gemini usage (/intel/meta-deck) but lives here because the War Decks
 * route runs in this app, not on the GCP backend.
 *
 * Design rules, all in service of the $0 rule and of never blocking a page:
 *   - Free-tier AI Studio key (`GEMINI_API_KEY`), REST only — no SDK, nothing
 *     added to the client bundle. Model via `GEMINI_MODEL` (default
 *     gemini-2.5-flash; thinking is switched off because the prompts are
 *     "judge these candidates", not "solve this").
 *   - Structured output: every call passes a JSON schema and parses the reply
 *     strictly. Callers get a typed object or `null` + a reason — never a throw.
 *   - Hard timeout (default 20s) so a slow model can't hold a Vercel function.
 *   - 429/5xx are reported, not retried: the free tier's per-minute cap means a
 *     retry storm just burns the day's quota.
 */
import { errText, log, stopwatch } from "./log";

const DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

/** Override only for local testing against a mock (see eval/mock-backend.mjs). */
const endpoint = () => process.env.GEMINI_API_BASE || DEFAULT_ENDPOINT;

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
  const model = geminiModel();
  const key = process.env.GEMINI_API_KEY;
  const t = stopwatch();
  if (!key) return { ok: false, reason: "GEMINI_API_KEY not set", model, ms: 0 };

  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    responseSchema: opts.schema,
    temperature: opts.temperature ?? 0.4,
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
  };
  // thinkingConfig is only accepted by 2.5-generation models; older ones 400 on it.
  if (/2\.5/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };

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
