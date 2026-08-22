/**
 * Clash Royale data layer. $0 by design, one place to touch.
 *
 * Primary path: official Supercell API via the free RoyaleAPI proxy
 * (https://proxy.royaleapi.dev — whitelist IP 45.79.218.79 on the Supercell key).
 * This removes the static-IP problem that killed the old lambda + NAT setup.
 *
 * Fallback path: the legacy AWS API Gateway (CR_API_BASE), kept only until AWS is
 * torn down. Missing env → path is skipped silently.
 *
 * ADDING A NEW ENDPOINT: write one `getX()` here that calls `viaProxy()`, type its
 * response in src/types/, and export it. Do not fetch Supercell from a component or
 * a route — everything goes through this file so caching and logging stay uniform.
 *
 * DEBUGGING: every fetch emits one "[clash]" json line (path, status, ms, trace).
 * `GET /api/health?probe=1` exercises this layer end-to-end and reports what broke.
 *
 * COST: all calls are ISR-cached 1h, so a page view costs at most one upstream call
 * per hour per tag. Never loop this over a member list — see rule 2 in CLAUDE.md.
 */

import type { Clan } from "@/types/Clan";
import type { Player } from "@/types/Player";
import { errText, log, stopwatch } from "./log";

const PROXY_BASE = process.env.CLASH_PROXY_BASE ?? "https://proxy.royaleapi.dev/v1";
const LEGACY_BASE = process.env.CR_API_BASE; // old AWS API Gateway, optional
export const HOME_CLAN_TAG = process.env.CLAN_TAG ?? "PRURJPJP";

export const CACHE_SECONDS = 3600;
const CACHE = { next: { revalidate: CACHE_SECONDS } } as const;

/** Options every getter accepts. `trace` ties the log lines to one request. */
export type ClashOpts = { trace?: string };

function encodeTag(tag: string): string {
  const t = tag.trim().toUpperCase().replace(/^#/, "");
  return encodeURIComponent(`#${t}`);
}

async function attempt<T>(
  name: string,
  url: string,
  headers?: Record<string, string>,
  trace?: string,
): Promise<T | null> {
  const elapsed = stopwatch();
  try {
    const res = await fetch(url, { headers, ...CACHE });
    log("clash", { path: name, status: res.status, ms: elapsed(), trace });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    log("clash", { path: name, err: errText(e, 150), ms: elapsed(), trace });
    return null;
  }
}

async function viaProxy<T>(path: string, trace?: string): Promise<T | null> {
  const key = process.env.SUPERCELL_API_KEY;
  if (!key) {
    log("clash", { path: `proxy:${path}`, err: "missing SUPERCELL_API_KEY", ms: 0, trace });
    return null;
  }
  return attempt<T>(`proxy:${path}`, `${PROXY_BASE}${path}`, { Authorization: `Bearer ${key}` }, trace);
}

export async function getClan(tag: string = HOME_CLAN_TAG, opts: ClashOpts = {}): Promise<Clan | null> {
  return (
    (await viaProxy<Clan>(`/clans/${encodeTag(tag)}`, opts.trace)) ??
    (LEGACY_BASE
      ? await attempt<Clan>("legacy:clan", `${LEGACY_BASE}/clan?tag=${tag.replace(/^#/, "")}`, undefined, opts.trace)
      : null)
  );
}

export async function getPlayer(tag: string, opts: ClashOpts = {}): Promise<Player | null> {
  return (
    (await viaProxy<Player>(`/players/${encodeTag(tag)}`, opts.trace)) ??
    (LEGACY_BASE
      ? await attempt<Player>("legacy:player", `${LEGACY_BASE}/user?id=${tag.replace(/^#/, "")}`, undefined, opts.trace)
      : null)
  );
}

/** Config snapshot for GET /api/health. Never returns key material — booleans only. */
export function clashConfig() {
  return {
    proxyBase: PROXY_BASE,
    homeClanTag: HOME_CLAN_TAG,
    cacheSeconds: CACHE_SECONDS,
    supercellKeyPresent: Boolean(process.env.SUPERCELL_API_KEY),
    legacyFallbackConfigured: Boolean(LEGACY_BASE),
  };
}
