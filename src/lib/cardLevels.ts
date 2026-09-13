/**
 * Card level normalization — shared by the War Decks engine (server) and the
 * pages that print levels (client), so it stays dependency-free.
 */
type LevelCard = { level: number; maxLevel?: number };

/**
 * The API's `level` is relative to the rarity's `maxLevel`: in Sept 2026 a
 * common caps at 16, rare 14, epic 11, legendary 8 (verified on a live
 * profile — a Goblin Barrel "level 9 / max 11" is an in-game 14). In-game
 * level = level + (cap − maxLevel), where `cap` is the game's top level —
 * the commons' maxLevel. Pass the cap inferred from the collection
 * (`levelCap`) so this keeps working when Supercell raises it again.
 */
export const DEFAULT_LEVEL_CAP = 16;

export function displayedLevel(card: LevelCard, cap = DEFAULT_LEVEL_CAP): number {
  const max = typeof card.maxLevel === "number" ? card.maxLevel : cap;
  return Math.max(1, Math.round(card.level + Math.max(0, cap - max)));
}

/** The game's current max card level, read off the collection (commons carry it). */
export function levelCap(cards: { maxLevel?: number }[]): number {
  return cards.reduce((cap, c) => (typeof c.maxLevel === "number" && c.maxLevel > cap ? c.maxLevel : cap), DEFAULT_LEVEL_CAP);
}

