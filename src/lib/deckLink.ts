/**
 * Clash Royale "copy deck" deep links.
 *
 * Verified format (RoyaleAPI deck-builder docs, Aug 2026):
 *
 *   https://link.clashroyale.com/deck/en?deck=26000046;26000036;…;28000008
 *
 * — the language lives in the PATH (`/deck/en`), and `deck` is a single query
 * param holding exactly 8 semicolon-separated numeric card ids. Optional
 * `slots=`/`tt=` (tower troop) params exist in some newer share links but are
 * not required: the game fills empty slots itself, and passing a wrong tower
 * troop is worse than passing none. We emit the minimal, universally-accepted
 * shape.
 */
import { normalizeCardName, type CardIdMap } from "./useCardIcons";

const DECK_LINK_BASE = "https://link.clashroyale.com/deck/en?deck=";

/** A Clash Royale deck is always exactly 8 cards. */
export const DECK_SIZE = 8;

/**
 * Build a copy-deck deep link for a full 8-card deck.
 *
 * @param names — card names as stored/returned by the backend. Tolerates the
 *   usual variants ("Evo Knight", "P.E.K.K.A", "Log") via normalizeCardName.
 * @param ids — normalized-name → card-id map from `useCardCatalog()`. Passed in
 *   rather than imported because it loads asynchronously per page.
 * @returns the deep link, or null when the deck isn't exactly 8 cards or any
 *   name can't be resolved to an id (ids not loaded yet, unknown card).
 */
export function buildDeckLink(
  names: string[] | undefined | null,
  ids: CardIdMap
): string | null {
  if (!Array.isArray(names) || names.length !== DECK_SIZE) return null;

  const resolved: number[] = [];
  for (const name of names) {
    if (typeof name !== "string" || !name) return null;
    const id = ids[normalizeCardName(name)];
    if (typeof id !== "number") return null;
    resolved.push(id);
  }

  return `${DECK_LINK_BASE}${resolved.join(";")}`;
}
