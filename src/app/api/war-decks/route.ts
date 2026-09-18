import { NextResponse } from "next/server";
import { errText, log, newTrace, stopwatch } from "@/lib/log";
import { BACKEND_OFFLINE, isConnectFailure } from "@/lib/proxyJson";
import { buildWarLineups, indexCollection, type PlayerInput, type WarResult } from "@/lib/warDecks";
import { coachLineups, type AdvisorOutcome } from "@/lib/warAdvisor";
import { META_SNAPSHOT, type TrophyBand } from "@/data/metaDecks";

/**
 * POST /api/war-decks  { tag: "#ABC123", band?: "low"|"mid"|"high"|"top" }
 *
 * Builds 4 Clan War decks for a player: one backend call for the player's
 * collection (levels, evolutions, trophies), the pure engine in
 * src/lib/warDecks.ts, then Gemini (src/lib/warAdvisor.ts) to choose between
 * lineups and coach each deck. No Gemini key → rule-based result, flagged in
 * `advisor`. One user click = one backend call + at most one Gemini call.
 */
export const dynamic = "force-dynamic";
// Player fetch (≤15s) + Gemini (≤25s) must fit inside the function budget.
export const maxDuration = 60;

const PLAYER_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;

type WarDecksResponse = {
  player: { tag: string; name?: string; trophies?: number; bestTrophies?: number; expLevel?: number };
  band: TrophyBand;
  bandSource: WarResult["bandSource"];
  ref: number;
  ownedCount: number;
  decks: AdvisorOutcome["decks"];
  summary: string;
  alternates: { score: number; decks: { name: string; family: string; cards: string[] }[] }[];
  unusedTop: WarResult["unusedTop"];
  notes: string[];
  meta: { updated: string; season: string; trends: string[] };
  advisor: AdvisorOutcome["advisor"];
  cached?: boolean;
};

// Best-effort per-instance cache: Gemini's free tier is per-minute limited,
// and clanmates re-run the same tag while comparing. Never shared across
// Vercel instances — that's fine, it only needs to absorb repeats.
const cache = new Map<string, { at: number; body: WarDecksResponse }>();

function normalizeTag(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const tag = raw.trim().toUpperCase().replace(/^#/, "");
  return /^[A-Z0-9]{3,12}$/.test(tag) ? `#${tag}` : null;
}

const BANDS: TrophyBand[] = ["low", "mid", "high", "top"];

export async function POST(request: Request) {
  const trace = newTrace();
  const elapsed = stopwatch();
  const apiBase = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;
  if (!apiBase || !apiKey) {
    return NextResponse.json({ error: "Missing API_BASE_URL or API_KEY in environment." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const tag = normalizeTag(body?.tag);
  if (!tag) return NextResponse.json({ error: "Enter a player tag like #ABC123." }, { status: 400 });
  const band = BANDS.includes(body?.band) ? (body.band as TrophyBand) : undefined;

  const cacheKey = `${tag}|${band ?? "auto"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    log("api", { route: "war-decks", tag, band: band ?? "auto", status: 200, ms: elapsed(), cached: true, trace });
    return NextResponse.json({ ...hit.body, cached: true });
  }

  // ── 1. Player collection from the backend ──
  let player: PlayerInput & { name?: string; bestTrophies?: number; expLevel?: number; tag?: string };
  const t = stopwatch();
  try {
    const res = await fetch(`${apiBase}/clash/player/${encodeURIComponent(tag)}`, {
      headers: { "x-api-key": apiKey, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(PLAYER_TIMEOUT_MS),
    });
    const text = await res.text();
    log("backend", { path: `/clash/player/${tag}`, status: res.status, ms: t(), trace });
    let json: Record<string, unknown> | null = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const msg = (json?.message as string) || (json?.reason as string) || (json?.error as string) || `HTTP ${res.status}`;
      const status = res.status === 404 ? 404 : 502;
      return NextResponse.json({ error: res.status === 404 ? `No player found for ${tag}.` : `Backend error: ${msg}` }, { status });
    }
    if (!json || !Array.isArray(json.cards)) {
      return NextResponse.json({ error: "Backend returned a player without a card collection — can't build war decks." }, { status: 502 });
    }
    const pol = json.currentPathOfLegendSeasonResult as { leagueNumber?: number } | undefined;
    player = {
      tag: typeof json.tag === "string" ? json.tag : tag,
      name: typeof json.name === "string" ? json.name : undefined,
      trophies: typeof json.trophies === "number" ? json.trophies : undefined,
      bestTrophies: typeof json.bestTrophies === "number" ? json.bestTrophies : undefined,
      expLevel: typeof json.expLevel === "number" ? json.expLevel : undefined,
      leagueNumber: typeof pol?.leagueNumber === "number" ? pol.leagueNumber : undefined,
      cards: json.cards as PlayerInput["cards"],
    };
  } catch (e) {
    const aborted = (e as Error)?.name === "TimeoutError" || (e as Error)?.name === "AbortError";
    log("backend", { path: `/clash/player/${tag}`, err: errText(e), ms: t(), trace });
    return NextResponse.json(
      {
        error: aborted
          ? "The backend didn't answer in time — try again."
          : isConnectFailure(e)
          ? BACKEND_OFFLINE
          : `Could not reach backend: ${errText(e, 80)}`,
      },
      { status: 504 }
    );
  }

  // ── 2. Engine ──
  const result = buildWarLineups(player, { band, lineups: 3 });
  const owned = indexCollection(player);

  // ── 3. Coach (Gemini, with canned fallback) ──
  const coached = await coachLineups(result, owned, player, trace);

  const chosen = result.lineups[coached.advisor.lineupIndex] ?? result.lineups[0];
  const alternates = result.lineups
    .filter((l) => l !== chosen)
    .map((l) => ({ score: l.score, decks: l.decks.map((d) => ({ name: d.name, family: d.family, cards: d.cards.map((c) => c.label) })) }));

  const response: WarDecksResponse = {
    player: { tag: player.tag ?? tag, name: player.name, trophies: player.trophies, bestTrophies: player.bestTrophies, expLevel: player.expLevel },
    band: result.band,
    bandSource: result.bandSource,
    ref: result.ref,
    ownedCount: result.ownedCount,
    decks: coached.decks,
    summary: coached.summary,
    alternates,
    unusedTop: result.unusedTop,
    notes: result.notes,
    meta: { updated: META_SNAPSHOT.updated, season: META_SNAPSHOT.season, trends: META_SNAPSHOT.trends.slice(0, 5) },
    advisor: coached.advisor,
  };

  if (response.decks.length > 0) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(cacheKey, { at: Date.now(), body: response });
  }

  log("api", {
    route: "war-decks",
    tag,
    band: result.band,
    decks: response.decks.length,
    advisor: coached.advisor.used ? coached.advisor.model : `off: ${coached.advisor.reason}`,
    status: 200,
    ms: elapsed(),
    trace,
  });
  return NextResponse.json(response);
}
