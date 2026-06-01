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

/**
 * Given the opponent cards that are beating a player, fetch real top-player
 * decks that beat similar lineups.
 * @param oppCards — the troublesome opponent cards (e.g. biggest-opps)
 * @param signal — optional abort signal to cancel in-flight requests
 */
export async function fetchDeckCounters(
  oppCards: string[],
  signal?: AbortSignal
): Promise<DeckCounter[]> {
  const cards = oppCards.filter(Boolean).slice(0, 6);
  if (cards.length === 0) return [];

  const query = `Counter deck that beats opponents who play: ${cards.join(', ')}.`;

  const res = await fetch('/api/deck-intel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, topK: 6 }),
    signal,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.counters) ? (data.counters as DeckCounter[]) : [];
}
