/**
 * Clash Royale "copy deck" deep links.
 *
 * Format verified against RoyaleAPI's live copy links (2026-08-23 — they are
 * the reference implementation, battle-tested on iOS/Android daily):
 *
 *   https://link.clashroyale.com/en?clashroyale://copyDeck?deck=<id;×8>&tt=<towerTroopId>&l=Royals
 *
 * — the path is `/en`, and the query is the raw `clashroyale://copyDeck` app
 * URI (not percent-encoded; the second `?` and `;` are legal query bytes).
 * The in-game share button emits the same params, so this shape is what the
 * link handler + app expect today. Our previous `/deck/en?deck=` shape was
 * the older variant.
 *
 * Evolutions have NO separate parameter: the game assigns evolution slots by
 * POSITION — the first card(s) in `deck=` land in the player's unlocked evo
 * slots (confirmed in RoyaleAPI's deck-builder discussion: "As long as a card
 * is kept in the 1st position, it will be set to evolve"). So evo-tagged
 * names ("Evo X" / "Evolved X") are moved to the front, original order
 * otherwise preserved.
 *
 * `tt=` selects the tower troop (a 159xxxxxx card id) — included only when
 * the caller actually knows it; a wrong tower troop is worse than none.
 * `l=Royals` matches both reference emitters (the game's own share label).
 */
import { normalizeCardName, wantsEvo, type CardIdMap } from "./useCardIcons";

const DECK_LINK_BASE = "https://link.clashroyale.com/en?clashroyale://copyDeck?deck=";

/** A Clash Royale deck is always exactly 8 cards. */
export const DECK_SIZE = 8;

/**
 * Build a copy-deck deep link for a full 8-card deck.
 *
 * @param names — card names as stored/returned by the backend. Tolerates the
 *   usual variants ("Evo Knight", "P.E.K.K.A", "Log") via normalizeCardName.
 * @param ids — normalized-name → card-id map from `useCardCatalog()`. Passed in
 *   rather than imported because it loads asynchronously per page.
 * @param towerTroop — optional tower troop name (e.g. "Tower Princess",
 *   "Dagger Duchess"); resolved through the same catalog (supportItems are
 *   indexed there too). Silently omitted when unknown.
 * @returns the deep link, or null when the deck isn't exactly 8 cards or any
 *   name can't be resolved to an id (ids not loaded yet, unknown card).
 */
export function buildDeckLink(
  names: string[] | undefined | null,
  ids: CardIdMap,
  towerTroop?: string | null
): string | null {
  if (!Array.isArray(names) || names.length !== DECK_SIZE) return null;

  // Evolution slots are positional — evo-tagged cards go first (stable order).
  const ordered = [
    ...names.filter((n) => typeof n === "string" && wantsEvo(n)),
    ...names.filter((n) => !(typeof n === "string" && wantsEvo(n))),
  ];

  const resolved: number[] = [];
  for (const name of ordered) {
    if (typeof name !== "string" || !name) return null;
    const id = ids[normalizeCardName(name)];
    if (typeof id !== "number") return null;
    resolved.push(id);
  }

  let link = `${DECK_LINK_BASE}${resolved.join(";")}`;
  if (towerTroop) {
    const ttId = ids[normalizeCardName(towerTroop)];
    // Tower troops live in the 159xxxxxx id range; anything else means the
    // name resolved to a regular card (collision / bad data) — omit rather
    // than send a tt the game will reject.
    if (typeof ttId === "number" && ttId >= 159000000) link += `&tt=${ttId}`;
  }
  return `${link}&l=Royals`;
}
