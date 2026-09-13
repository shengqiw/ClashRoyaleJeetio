"use client";
import { useEffect, useState } from "react";

export type CardIconMap = Record<string, string>;

/** Normalized card name → numeric Supercell card id (for deck deep links). */
export type CardIdMap = Record<string, number>;

/** Everything one /api/cards fetch yields: icons, deep-link ids, display names. */
export type CardCatalog = {
  icons: CardIconMap;
  ids: CardIdMap;
  /** Display names, de-duplicated and sorted — used by card pickers. */
  names: string[];
};

const EMPTY_CATALOG: CardCatalog = { icons: {}, ids: {}, names: [] };

// Shape of each card returned by the backend /clash/cards endpoint (and, with
// the level fields, by /clash/player — see pickCardArt).
type ApiCard = {
  name: string;
  id?: number;
  iconUrls?: { medium?: string; evolutionMedium?: string; heroMedium?: string };
};

/**
 * A card object as the Supercell API returns it inside a player's collection,
 * current deck or a battle log. Evolutions and Heroes both ride on
 * `evolutionLevel` (verified on live profiles, Sept 2026): level ≥ 1 with an
 * `evolutionMedium` icon = evolution unlocked; level ≥ 2 with a `heroMedium`
 * icon = hero unlocked (hero-only cards jump straight to 2).
 */
export type ApiPlayerCard = {
  name?: string;
  evolutionLevel?: number;
  iconUrls?: { medium?: string; evolutionMedium?: string; heroMedium?: string };
};

export function hasHeroUnlocked(card: ApiPlayerCard): boolean {
  return (card.evolutionLevel ?? 0) >= 2 && Boolean(card.iconUrls?.heroMedium);
}

export function hasEvoUnlocked(card: ApiPlayerCard): boolean {
  return (card.evolutionLevel ?? 0) >= 1 && Boolean(card.iconUrls?.evolutionMedium);
}

/** The art to show for a card object: hero if unlocked, else evolution, else base. */
export function pickCardArt(card: ApiPlayerCard | undefined | null): string | undefined {
  if (!card) return undefined;
  if (hasHeroUnlocked(card)) return card.iconUrls?.heroMedium;
  if (hasEvoUnlocked(card)) return card.iconUrls?.evolutionMedium;
  return card.iconUrls?.medium;
}

// Fetched once per page load and shared across all hook consumers.
let cachePromise: Promise<CardCatalog> | null = null;

// Evolution / hero icons are indexed under these prefixes so an "Evo X" or
// "Hero X" name can opt into the distinct art (api .../cardevolutions/... and
// .../cardheroes/...) rather than the base card icon.
const EVO_KEY_PREFIX = "evo::";
const HERO_KEY_PREFIX = "hero::";

// Name helpers live in cardName.ts (no "use client") so server code can share
// them; re-exported here so existing imports keep working.
export { wantsEvo, wantsHero, normalizeCardName } from "./cardName";
import { wantsEvo, wantsHero, normalizeCardName } from "./cardName";

async function loadCardCatalog(): Promise<CardCatalog> {
  const res = await fetch("/api/cards");
  if (!res.ok) throw new Error(`Failed to load cards: HTTP ${res.status}`);
  const data = await res.json();
  const cards: ApiCard[] = [
    ...(data?.items ?? []),
    ...(data?.supportItems ?? []),
  ];
  const map: CardIconMap = {};
  const ids: CardIdMap = {};
  const names: string[] = [];
  for (const card of cards) {
    if (!card.name) continue;
    const norm = normalizeCardName(card.name);
    const base = card.iconUrls?.medium;
    const evo = card.iconUrls?.evolutionMedium;
    if (base) {
      map[card.name] = base;
      // Also index under the normalized key so fuzzy names resolve (see
      // resolveCardIcon). Exact names already in the map win on collision.
      if (norm && !(norm in map)) map[norm] = base;
    }
    // Index the evolution / hero art separately so tagged names get the right icon.
    if (evo && norm) map[EVO_KEY_PREFIX + norm] = evo;
    const hero = card.iconUrls?.heroMedium;
    if (hero && norm) map[HERO_KEY_PREFIX + norm] = hero;
    // Deck deep links address cards by their numeric id. Index under the
    // normalized key only — "Evo Knight" and "Knight" copy the same card.
    if (norm && typeof card.id === "number" && !(norm in ids)) {
      ids[norm] = card.id;
      names.push(card.name);
    }
  }
  names.sort((a, b) => a.localeCompare(b));
  return { icons: map, ids, names };
}

/**
 * Look up a card icon, tolerating the name variants LLMs and stored data emit:
 *  - fuzzy base names — "Log" → "The Log", "Pekka" → "P.E.K.K.A"
 *  - evolution names — "Evo Knight" → the distinct evolution art (falling back
 *    to the base icon if that card has no evolution).
 *  - hero names — "Hero Knight" → the hero art, same fallback.
 * Returns undefined if the card is unknown (or icons haven't loaded yet).
 */
export function resolveCardIcon(
  icons: CardIconMap,
  name: string
): string | undefined {
  const norm = normalizeCardName(name);
  if (wantsEvo(name)) {
    return icons[EVO_KEY_PREFIX + norm] ?? icons[name] ?? icons[norm];
  }
  if (wantsHero(name)) {
    return icons[HERO_KEY_PREFIX + norm] ?? icons[name] ?? icons[norm];
  }
  return icons[name] ?? icons[norm];
}

/**
 * Resolve the *base* (non-evolution) icon for a name, ignoring any evolution
 * art. Used as a runtime fallback when an evolutionMedium asset 404s — some
 * newer evo cards ship a broken evolution URL, so we degrade to the normal art.
 */
export function resolveBaseCardIcon(
  icons: CardIconMap,
  name: string
): string | undefined {
  const norm = normalizeCardName(name);
  return icons[name] ?? icons[norm];
}

/**
 * Returns the whole card catalog (icons + deep-link ids + display names) from
 * one shared /api/cards fetch. Every consumer on the page shares the same
 * in-flight promise, so this stays one request per page load.
 */
export function useCardCatalog(): CardCatalog {
  const [catalog, setCatalog] = useState<CardCatalog>(EMPTY_CATALOG);

  useEffect(() => {
    let active = true;
    if (!cachePromise) cachePromise = loadCardCatalog();
    cachePromise
      .then((loaded) => {
        if (active) setCatalog(loaded);
      })
      .catch(() => {
        // On failure, reset so a later mount can retry; leave the catalog empty.
        cachePromise = null;
      });
    return () => {
      active = false;
    };
  }, []);

  return catalog;
}

/**
 * Returns a map of card name -> medium icon URL, fetched once from /api/cards.
 * Use `icons[cardName]` to get an image src (may be undefined until loaded
 * or if a name has no match).
 */
export function useCardIcons(): CardIconMap {
  return useCardCatalog().icons;
}
