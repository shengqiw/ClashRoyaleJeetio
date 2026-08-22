import { NextRequest, NextResponse } from "next/server";
import { clashConfig, getClan, HOME_CLAN_TAG } from "@/lib/clash";
import { llmConfig, complete } from "@/lib/llm";
import { FEATURES } from "@/lib/features";
import { errText, log, newTrace, stopwatch } from "@/lib/log";

/**
 * GET /api/health — the one call that explains the whole system.
 *
 * THIS ENDPOINT IS FOR CLAUDE. When a future session is asked "the site is broken",
 * this is the first thing to hit; it answers, without reading any source:
 *   - which env keys exist (booleans only, never values)
 *   - what the data path and LLM chain are configured to do
 *   - which features are live vs merely planned
 *   - `warnings`: known-bad states in plain English, already diagnosed
 *
 * Modes:
 *   GET /api/health              config only, zero upstream calls, instant
 *   GET /api/health?probe=clash  also fetches the clan for real (free, cached)
 *   GET /api/health?probe=llm    also spends ONE free-tier LLM call — not free-forever
 *                                quota, so don't poll it
 *   GET /api/health?probe=all    both
 *
 * Never cached: a cached health check is a lie.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Every env var the app reads. Keep this list honest — it is the env contract. */
const ENV_KEYS = [
  "SUPERCELL_API_KEY",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
  "CLAN_TAG",
  "CLASH_PROXY_BASE",
  "CR_API_BASE",
  "APP_NAME",
] as const;

type Probe = { name: string; ok: boolean; ms: number; detail?: string };

export async function GET(req: NextRequest) {
  const trace = newTrace();
  const elapsed = stopwatch();
  const mode = req.nextUrl.searchParams.get("probe") ?? "";
  const wantClash = mode === "clash" || mode === "all" || mode === "1";
  const wantLlm = mode === "llm" || mode === "all";

  const clash = clashConfig();
  const llm = llmConfig();
  const env = Object.fromEntries(ENV_KEYS.map((k) => [k, Boolean(process.env[k])]));

  const probes: Probe[] = [];

  if (wantClash) {
    const t = stopwatch();
    try {
      const clan = await getClan(HOME_CLAN_TAG, { trace });
      probes.push({
        name: "clash:getClan",
        ok: Boolean(clan),
        ms: t(),
        detail: clan
          ? `${clan.name} (${clan.tag}), ${clan.memberList?.length ?? 0} members`
          : "returned null — check the [clash] log line above for status",
      });
    } catch (e) {
      probes.push({ name: "clash:getClan", ok: false, ms: t(), detail: errText(e) });
    }
  }

  if (wantLlm) {
    const t = stopwatch();
    try {
      const r = await complete({
        system: "You are a health check. Reply with exactly: OK",
        user: "Reply OK.",
        maxTokens: 512,
        trace,
      });
      probes.push({
        name: "llm:complete",
        ok: true,
        ms: t(),
        detail: `${r.provider}/${r.model} → ${r.text.slice(0, 40)}`,
      });
    } catch (e) {
      probes.push({ name: "llm:complete", ok: false, ms: t(), detail: errText(e, 300) });
    }
  }

  const warnings = buildWarnings(clash, llm, probes);
  const ok = probes.every((p) => p.ok) && clash.supercellKeyPresent && llm.usableProviders > 0;

  log("health", { trace, mode: mode || "config", ok, warnings: warnings.length, ms: elapsed() });

  return NextResponse.json(
    {
      ok,
      trace,
      checkedAt: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      ms: elapsed(),
      warnings,
      clash,
      llm,
      env,
      features: FEATURES.map((f) => ({ key: f.key, href: f.href, status: f.status, inNav: f.inNav })),
      probes: probes.length ? probes : "none run — add ?probe=clash, ?probe=llm or ?probe=all",
    },
    { status: ok ? 200 : 503 },
  );
}

/** Known failure modes, pre-diagnosed. Add one here every time you debug something twice. */
function buildWarnings(
  clash: ReturnType<typeof clashConfig>,
  llm: ReturnType<typeof llmConfig>,
  probes: Probe[],
): string[] {
  const w: string[] = [];

  if (!clash.supercellKeyPresent) {
    w.push(
      "SUPERCELL_API_KEY missing — /stats will render its friendly fallback and every " +
        "clash call returns null. Set it in .env.local (see .env.example).",
    );
  }
  if (llm.usableProviders === 0) {
    w.push("No LLM provider keys present — POST /api/analyze will 503 on every request.");
  } else if (llm.usableProviders === 1) {
    const only = llm.fast.find((p) => p.keyPresent)?.provider;
    w.push(
      `Only one usable LLM provider (${only}) — the fallback chain cannot fall back. ` +
        "An outage or a stale model name is a hard 503. A free Groq key fixes this.",
    );
  }
  if (clash.legacyFallbackConfigured) {
    w.push(
      "CR_API_BASE is set, so the dead legacy AWS gateway is still in the fallback path. " +
        "Its lambdas carry a JWT IP-locked to a decommissioned NAT EIP and cannot succeed.",
    );
  }
  for (const p of probes) {
    if (!p.ok) w.push(`Probe ${p.name} FAILED: ${p.detail ?? "no detail"}`);
  }
  return w;
}
