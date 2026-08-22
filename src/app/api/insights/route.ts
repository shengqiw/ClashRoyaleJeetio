import { NextRequest, NextResponse } from "next/server";
import { getClan, HOME_CLAN_TAG } from "@/lib/clash";
import { analyzeClan } from "@/lib/insights";
import { log, newTrace, stopwatch } from "@/lib/log";

/**
 * GET /api/insights?tag=PRURJPJP — the derived clan facts as raw JSON.
 *
 * Costs exactly one (1h-cached) clan fetch, same as /stats. Useful for client
 * features and, honestly, for a Claude session that wants the computed numbers
 * without scraping the HTML. The math lives in src/lib/insights.ts.
 *
 * `?full=1` includes the per-member array; default is the summary only.
 */
export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const trace = newTrace();
  const elapsed = stopwatch();
  const tag = req.nextUrl.searchParams.get("tag") ?? HOME_CLAN_TAG;
  const full = req.nextUrl.searchParams.get("full") === "1";

  const clan = await getClan(tag, { trace });
  if (!clan) {
    log("api", { route: "/api/insights", trace, status: 502, ms: elapsed() });
    return NextResponse.json({ error: "clan unavailable", trace }, { status: 502 });
  }

  const insights = analyzeClan(clan);
  log("api", {
    route: "/api/insights",
    trace,
    status: 200,
    ms: elapsed(),
    members: insights.roster.members,
    inactive: insights.activity.inactive,
  });

  if (full) return NextResponse.json(insights);
  const summary = { ...insights, members: undefined };
  return NextResponse.json(summary);
}
