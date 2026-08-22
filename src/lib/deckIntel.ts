/**
 * Deck-intel helper — pulls "what the top 50 beat this with" matchups from the
 * ingested Path of Legend embeddings (Pinecone `pol-battles` namespace) via the
 * /api/deck-intel proxy.
 */

export type DeckCounter = {
  score: number;
  winnerCards: string[];
  loserCards: string[];
  winnerAvgElixir: number | null;
  occurrences: number | null;
  avgCrownMargin: number | null;
};

/** Trophy bands the backend buckets ladder data into. */
export type TrophyBand = "low" | "mid" | "high" | "top" | "unknown";

/** What the band <select> can hold — "auto" means "let the backend detect it". */
export type BandChoice = "auto" | "low" | "mid" | "high" | "top";

export const BAND_CHOICES: BandChoice[] = ["auto", "low", "mid", "high", "top"];

/** Terse display label for a detected band. */
export const BAND_LABELS: Record<TrophyBand, string> = {
  low: "LOW LADDER",
  mid: "MID LADDER",
  high: "HIGH LADDER",
  top: "TOP LADDER",
  unknown: "BAND UNKNOWN",
};

/** The band value to send upstream, or undefined when the user picked Auto. */
export function bandParam(choice: BandChoice): string | undefined {
  return choice === "auto" ? undefined : choice;
}

/** POST /api/deck-intel and unwrap the counters array. */
async function postDeckIntel(
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<DeckCounter[]> {
  const res = await fetch('/api/deck-intel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.counters) ? (data.counters as DeckCounter[]) : [];
}

/**
 * Given the opponent cards that are beating a player, fetch real top-player
 * decks that beat similar lineups.
 * @param oppCards — the troublesome opponent cards (e.g. biggest-opps)
 * @param tag — player tag, so the backend reads their own cr-bg-<tag> index
 *              (falling back to cr-bg-global) instead of a shared one
 * @param signal — optional abort signal to cancel in-flight requests
 * @param band — optional trophy band, so results come from comparable ladder
 */
export async function fetchDeckCounters(
  oppCards: string[],
  tag?: string,
  signal?: AbortSignal,
  band?: string
): Promise<DeckCounter[]> {
  const cards = oppCards.filter(Boolean).slice(0, 6);
  if (cards.length === 0) return [];

  const query = `Counter deck that beats opponents who play: ${cards.join(', ')}.`;

  return postDeckIntel({ query, topK: 3, tag, band }, signal);
}

/**
 * Matchup mode: the user names the deck they keep running into, we ask for the
 * decks that actually beat it. Same index as fetchDeckCounters — only the query
 * framing (a known full/partial deck rather than "cards that beat me") differs.
 * @param deckCards — 3–8 cards of the opposing deck
 */
export async function fetchCountersForDeck(
  deckCards: string[],
  signal?: AbortSignal,
  band?: string
): Promise<DeckCounter[]> {
  const cards = deckCards.filter(Boolean).slice(0, 8);
  if (cards.length === 0) return [];

  const query = `Deck that beats this opponent deck: ${cards.join(', ')}.`;

  return postDeckIntel({ query, topK: 5, band }, signal);
}
