import { NextRequest, NextResponse } from "next/server";
import { getPlayer } from "@/lib/clash";
import { log, newTrace, stopwatch } from "@/lib/log";

/**
 * GET /api/player?tag=XXXX — one player, for user-initiated lookups. Cached 1h.
 *
 * COST RULE: one click = one call. Never call this in a loop over the roster —
 * that is the N+1 pattern that got the old stats page disabled (rule 2, CLAUDE.md).
 * Anything you want for ALL members belongs in src/lib/insights.ts instead.
 */
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const trace = newTrace();
  const elapsed = stopwatch();
  const tag = req.nextUrl.searchParams.get("tag");

  if (!tag) {
    log("api", { route: "/api/player", trace, status: 400, err: "missing tag", ms: elapsed() });
    return NextResponse.json({ error: "missing tag", trace }, { status: 400 });
  }

  const player = await getPlayer(tag, { trace });
  const status = player ? 200 : 502;
  log("api", { route: "/api/player", trace, tag, status, ms: elapsed() });

  if (!player) return NextResponse.json({ error: "player unavailable", trace }, { status: 502 });
  return NextResponse.json(player);
}
