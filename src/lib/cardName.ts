/**
 * Card-name normalization shared by client code (useCardIcons) and server code
 * (the War Decks engine). Kept in its own module with no "use client" directive
 * so route handlers and tests can import it without dragging React in.
 */

/** True when a name asks for the evolution variant ("Evo Knight", "Evolved Knight"). */
export function wantsEvo(name: string): boolean {
  return /^\s*(evo|evolved)\s+/i.test(name);
}

/** True when a name asks for the hero variant ("Hero Knight"). */
export function wantsHero(name: string): boolean {
  return /^\s*hero\s+/i.test(name);
}

/** "Evo Knight" / "Hero Knight" / "Evolved Knight" → "Knight". */
export function baseCardName(name: string): string {
  return name.replace(/^\s*(evo|evolved|hero)\s+/i, "").trim();
}

/**
 * Collapse a card name to a comparison key that tolerates the variants an LLM
 * (or stored "Evo " prefix) produces: case, punctuation/spaces ("P.E.K.K.A" →
 * "pekka"), and the leading words "Evo "/"Evolved "/"Hero "/"The " ("Log" ⇄ "The Log").
 */
export function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(evo|evolved|hero)\s+/, "")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]/g, "");
}
