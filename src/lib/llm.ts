/**
 * Free-tier LLM fallback chain. $0 by design.
 *
 * Every provider here speaks the OpenAI chat-completions dialect, so one fetch
 * shape covers all of them. Providers with a missing API key are skipped, and
 * any error (rate limit, stale model name, outage) falls through to the next
 * provider instead of failing the request.
 *
 * DEBUGGING (for future Claude sessions / server logs):
 *   Every attempt emits one JSON line prefixed "[llm]" via src/lib/log.ts.
 *   Fields: provider, model, ok, ms, status, err, trace. The API response also
 *   echoes which provider answered and the full attempt trail.
 *   `GET /api/health` reports which provider keys are actually present — a chain
 *   with one key is not a chain, it is a single point of failure.
 *
 * Free tiers change monthly. If a provider starts failing with 400/404, its
 * model name went stale — update MODELS below; the chain keeps the site alive
 * in the meantime.
 */

import { errText, log, stopwatch } from "./log";

type Provider = {
  name: string;
  baseURL: string;
  model: string;
  keyEnv: string;
  timeoutMs: number;
};

const GROQ: Provider = {
  name: "groq",
  baseURL: "https://api.groq.com/openai/v1",
  model: "llama-3.3-70b-versatile",
  keyEnv: "GROQ_API_KEY",
  timeoutMs: 25_000,
};

const GEMINI: Provider = {
  // Google AI Studio free-tier key, via Google's OpenAI-compatible endpoint.
  name: "gemini",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  model: "gemini-3.6-flash",
  keyEnv: "GEMINI_API_KEY",
  timeoutMs: 30_000,
};

const OPENROUTER_FAST: Provider = {
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  model: "deepseek/deepseek-chat-v3-0324:free",
  keyEnv: "OPENROUTER_API_KEY",
  timeoutMs: 45_000,
};

const OPENROUTER_R1: Provider = {
  // DeepSeek R1 free — slow but deep reasoning. Only leads the chain when depth="deep".
  name: "openrouter-r1",
  baseURL: "https://openrouter.ai/api/v1",
  model: "deepseek/deepseek-r1:free",
  keyEnv: "OPENROUTER_API_KEY",
  timeoutMs: 90_000,
};

const FAST_CHAIN = [GROQ, GEMINI, OPENROUTER_FAST];
const DEEP_CHAIN = [OPENROUTER_R1, GROQ, GEMINI];

export type Attempt = {
  provider: string;
  model: string;
  ok: boolean;
  ms: number;
  status?: number;
  err?: string;
};

export type LlmResult = {
  text: string;
  provider: string;
  model: string;
  ms: number;
  attempts: Attempt[];
};

/** Config snapshot for GET /api/health. Booleans only — never leaks key material. */
export function llmConfig() {
  const shape = (chain: Provider[]) =>
    chain.map((p) => ({
      provider: p.name,
      model: p.model,
      keyEnv: p.keyEnv,
      keyPresent: Boolean(process.env[p.keyEnv]),
      timeoutMs: p.timeoutMs,
    }));
  const fast = shape(FAST_CHAIN);
  return {
    fast,
    deep: shape(DEEP_CHAIN),
    /** How many providers could actually answer. 0 = every request 503s. 1 = no real fallback. */
    usableProviders: fast.filter((p) => p.keyPresent).length,
  };
}

export async function complete(opts: {
  system: string;
  user: string;
  depth?: "fast" | "deep";
  maxTokens?: number;
  /** Correlation id from the calling route, so [llm] and [api] lines line up. */
  trace?: string;
}): Promise<LlmResult> {
  const chain = opts.depth === "deep" ? DEEP_CHAIN : FAST_CHAIN;
  const attempts: Attempt[] = [];

  for (const p of chain) {
    const key = process.env[p.keyEnv];
    if (!key) {
      attempts.push({ provider: p.name, model: p.model, ok: false, ms: 0, err: `missing ${p.keyEnv}` });
      continue;
    }

    const elapsed = stopwatch();
    try {
      const res = await fetch(`${p.baseURL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: p.model,
          // 4096, not 1024: thinking models (gemini-3.x, R1) spend hidden reasoning
          // tokens against this cap and return a truncated answer if it is too low.
          max_tokens: opts.maxTokens ?? 4096,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
        }),
        signal: AbortSignal.timeout(p.timeoutMs),
      });

      const ms = elapsed();
      if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        const attempt = { provider: p.name, model: p.model, ok: false, ms, status: res.status, err: body };
        attempts.push(attempt);
        log("llm", { ...attempt, trace: opts.trace });
        continue;
      }

      const json = await res.json();
      // R1-style models sometimes put everything in reasoning and leave content empty.
      const msg = json.choices?.[0]?.message;
      const text: string = msg?.content?.trim() || msg?.reasoning?.trim() || "";
      if (!text) {
        const attempt = { provider: p.name, model: p.model, ok: false, ms, err: "empty completion" };
        attempts.push(attempt);
        log("llm", { ...attempt, trace: opts.trace });
        continue;
      }

      const attempt = { provider: p.name, model: p.model, ok: true, ms };
      attempts.push(attempt);
      log("llm", { ...attempt, trace: opts.trace });
      return { text, provider: p.name, model: p.model, ms, attempts };
    } catch (e) {
      const attempt = {
        provider: p.name,
        model: p.model,
        ok: false,
        ms: elapsed(),
        err: errText(e),
      };
      attempts.push(attempt);
      log("llm", { ...attempt, trace: opts.trace });
    }
  }

  const summary = attempts.map((a) => `${a.provider}: ${a.err ?? a.status ?? "?"}`).join(" | ");
  throw new Error(`All LLM providers failed — ${summary}`);
}
