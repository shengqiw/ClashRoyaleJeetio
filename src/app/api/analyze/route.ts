import { NextRequest, NextResponse } from "next/server";
import { complete } from "@/lib/llm";
import { getClan, HOME_CLAN_TAG } from "@/lib/clash";
import { analyzeClan } from "@/lib/insights";
import type { Clan } from "@/types/Clan";
import { errText, log, newTrace, stopwatch } from "@/lib/log";

/**
 * POST /api/analyze
 * Body: { data?: Clan; tag?: string; question?: string; depth?: "fast" | "deep" }
 *
 * `data` = analyze a clan payload the caller already has (the /stats page does this,
 * so asking the coach costs zero extra Clash calls). `tag` = let the server fetch it
 * (cached 1h). Neither = the home clan.
 *
 * The prompt is built in two parts: PRE-COMPUTED FACTS from src/lib/insights.ts,
 * then the slimmed roster. The facts block exists because free models happily invent
 * averages; giving them the arithmetic already done removes the temptation.
 *
 * DEBUGGING: one "[api]" line per request and one "[llm]" line per provider attempt,
 * all sharing a `trace` id. The response echoes provider, model, ms, attempts, trace.
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `You are jeetio's Clash Royale coach — a sharp, friendly analyst for a
free community clan site. You receive pre-computed clan facts plus the roster, and
answer with practical, specific insight: who's carrying, who's inactive, donation
culture, war readiness, and what the clan should actually do next. Keep it under 300
words, use short paragraphs or tight bullet lists, cite the real numbers you were
given, and never invent a stat that isn't in the data. The FACTS block is already
calculated and correct — trust it over your own arithmetic. Tone: fun, a little
competitive, zero corporate.`;

// Keep member objects small so free-tier token/minute limits aren't blown.
function slimMember(m: Record<string, unknown>) {
  const { name, role, trophies, donations, donationsReceived, lastSeen, clanRank, expLevel } = m as never;
  return { name, role, trophies, donations, donationsReceived, lastSeen, clanRank, expLevel };
}

function slim(data: unknown): unknown {
  if (data && typeof data === "object" && Array.isArray((data as { memberList?: unknown[] }).memberList)) {
    const d = data as Record<string, unknown> & { memberList: Record<string, unknown>[] };
    return {
      name: d.name,
      tag: d.tag,
      description: d.description,
      clanScore: d.clanScore,
      clanWarTrophies: d.clanWarTrophies,
      requiredTrophies: d.requiredTrophies,
      donationsPerWeek: d.donationsPerWeek,
      members: d.members,
      memberList: d.memberList.map(slimMember),
    };
  }
  return data;
}

function isClan(data: unknown): data is Clan {
  return Boolean(data && typeof data === "object" && Array.isArray((data as Clan).memberList));
}

/** Pre-computed arithmetic the model should not have to (and should not) redo. */
function factsBlock(clan: Clan): string {
  const i = analyzeClan(clan);
  return [
    "FACTS (pre-computed, authoritative):",
    ...i.headlines.map((h) => `- ${h}`),
    `- Role split: ${Object.entries(i.roster.roles).map(([r, n]) => `${n} ${r}`).join(", ")}.`,
    `- Median trophies ${i.trophies.median}; top: ${i.trophies.top.map((t) => `${t.name} ${t.trophies}`).join(", ")}.`,
    i.donations.freeloaders.length
      ? `- Taking far more than they give: ${i.donations.freeloaders
          .slice(0, 5)
          .map((f) => `${f.name} (gave ${f.donations}, got ${f.donationsReceived})`)
          .join(", ")}.`
      : "- No freeloaders by the current threshold.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const trace = newTrace();
  const elapsed = stopwatch();

  let body: { data?: unknown; tag?: string; question?: string; depth?: "fast" | "deep" };
  try {
    body = await req.json();
  } catch {
    log("api", { route: "/api/analyze", trace, status: 400, err: "invalid JSON", ms: elapsed() });
    return NextResponse.json({ error: "invalid JSON body", trace }, { status: 400 });
  }

  // Caller-supplied payload wins (zero extra Clash calls); otherwise fetch it once.
  let data = body.data;
  if (!data) {
    data = (await getClan(body.tag ?? HOME_CLAN_TAG, { trace })) ?? undefined;
    if (!data) {
      log("api", { route: "/api/analyze", trace, status: 502, err: "clan unavailable", ms: elapsed() });
      return NextResponse.json({ error: "clan data unavailable", trace }, { status: 502 });
    }
  }

  const facts = isClan(data) ? factsBlock(data) : "";
  const payload = JSON.stringify(slim(data));
  if (payload.length > 60_000) {
    log("api", { route: "/api/analyze", trace, status: 413, bytes: payload.length, ms: elapsed() });
    return NextResponse.json({ error: "data too large", trace }, { status: 413 });
  }

  const question = (body.question || "Give me the state of the clan and what we should focus on.").slice(0, 500);

  try {
    const result = await complete({
      system: SYSTEM,
      user: `${facts}\n\nRAW DATA:\n${payload}\n\nQuestion: ${question}`,
      depth: body.depth === "deep" ? "deep" : "fast",
      trace,
    });
    log("api", {
      route: "/api/analyze",
      trace,
      status: 200,
      provider: result.provider,
      depth: body.depth === "deep" ? "deep" : "fast",
      ms: elapsed(),
    });
    return NextResponse.json({
      analysis: result.text,
      provider: result.provider,
      model: result.model,
      ms: result.ms,
      attempts: result.attempts,
      trace,
    });
  } catch (e) {
    log("api", { route: "/api/analyze", trace, status: 503, err: errText(e, 300), ms: elapsed() });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "analysis failed", trace },
      { status: 503 },
    );
  }
}
