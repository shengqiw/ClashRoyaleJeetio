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

// Shape of each card returned by the backend /clash/cards endpoint.
type ApiCard = {
  name: string;
  id?: number;
  iconUrls?: { medium?: string; evolutionMedium?: string };
};

// Fetched once per page load and shared across all hook consumers.
let cachePromise: Promise<CardCatalog> | null = null;

// Evolution icons are indexed under this prefix so an "Evo "/"Evolved " name
// can opt into the distinct evolution art (api .../cardevolutions/...) rather
// than the base card icon.
const EVO_KEY_PREFIX = "evo::";

/** True when a name asks for the evolution variant ("Evo Knight", "Evolved Knight"). */
function wantsEvo(name: string): boolean {
  return /^\s*(evo|evolved)\s+/i.test(name);
}

/**
 * Collapse a card name to a comparison key that tolerates the variants an LLM
 * (or stored "Evo " prefix) produces: case, punctuation/spaces ("P.E.K.K.A" →
 * "pekka"), and the leading words "Evo "/"Evolved "/"The " ("Log" ⇄ "The Log").
 */
export function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(evo|evolved)\s+/, "")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]/g, "");
}

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
    // Index the evolution art separately so evo-tagged names get the right icon.
    if (evo && norm) map[EVO_KEY_PREFIX + norm] = evo;
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
