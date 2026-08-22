import { NextRequest, NextResponse } from "next/server";
import { getClan, HOME_CLAN_TAG } from "@/lib/clash";
import { log, newTrace, stopwatch } from "@/lib/log";

/** GET /api/clan?tag=PRURJPJP — clan data for client-side features. Cached 1h server-side. */
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const trace = newTrace();
  const elapsed = stopwatch();
  const tag = req.nextUrl.searchParams.get("tag") ?? HOME_CLAN_TAG;

  const clan = await getClan(tag, { trace });
  const status = clan ? 200 : 502;
  log("api", { route: "/api/clan", trace, tag, status, ms: elapsed() });

  if (!clan) return NextResponse.json({ error: "clan unavailable", trace }, { status: 502 });
  return NextResponse.json(clan);
}
