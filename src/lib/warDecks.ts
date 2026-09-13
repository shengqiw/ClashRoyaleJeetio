/**
 * War Decks engine — builds 4 Clan War decks (32 different cards) for one
 * player from the current meta snapshot and the player's real card levels.
 *
 * Pure TypeScript: no Next, no React, no network. The API route feeds it the
 * player object from the Supercell API (via the backend) and Gemini only ever
 * chooses between / annotates lineups this engine already validated. That split
 * is deliberate — the hard constraints (own every card, no card twice, one deck
 * per archetype family) are enforced here where they can be unit-tested, and
 * the LLM is kept to the part it is good at: judgement and explanation.
 *
 * How a lineup is built
 *   1. Levels: the API reports rarity-relative levels (a max Legendary is
 *      level 8 of 8). `displayedLevel` converts to the in-game 1–16 number.
 *      The player's "competitive level" (`ref`) is the median of their 32 best
 *      cards — that is what their war decks can realistically be built at.
 *   2. Realize: each meta template is rebuilt from the player's collection.
 *      Owned cards stay; missing or badly underleveled cards are swapped for
 *      the best owned card doing the same job (cardRoles.ts). A card already
 *      spent in another war deck counts as missing. No swap → deck infeasible.
 *   3. Score: meta tier + band fit + card levels − swap costs.
 *   4. Search: greedy lineup building seeded from several top decks, then one
 *      local-improvement pass; the best few distinct lineups are returned.
 */
import { CARD_ROLES, ROLE_FALLBACKS, type CardRole } from "../data/cardRoles";
import { META_DECKS, META_SNAPSHOT, type DeckFamily, type MetaDeck, type TrophyBand } from "../data/metaDecks";
import { baseCardName, normalizeCardName, wantsEvo, wantsHero } from "./cardName";

// ── Types ──────────────────────────────────────────────────────────────────

/** One entry of the Supercell player `cards[]` array (fields we read). */
export type PlayerCard = {
  name: string;
  level: number;
  maxLevel?: number;
  rarity?: string;
  evolutionLevel?: number;
  maxEvolutionLevel?: number;
  elixirCost?: number;
  [extra: string]: unknown;
};

export type PlayerInput = {
  tag?: string;
  name?: string;
  trophies?: number;
  bestTrophies?: number;
  expLevel?: number;
  /** currentPathOfLegendSeasonResult.leagueNumber, when present. */
  leagueNumber?: number;
  cards: PlayerCard[];
};

export type OwnedCard = {
  /** Catalog name as the API spells it. */
  name: string;
  key: string;
  level: number;
  elixir: number;
  evo: boolean;
  hero: boolean;
  roles: CardRole[];
};

export type WarCard = {
  name: string;
  /** Display label — "Evo Knight" / "Hero Knight" when that variant is in play. */
  label: string;
  level: number;
  elixir: number;
  evo: boolean;
  hero: boolean;
  /** Template card this one replaced, when it is a substitution. */
  replaces?: string;
  reason?: string;
};

export type WarDeck = {
  templateId: string;
  name: string;
  family: DeckFamily;
  tier: MetaDeck["tier"];
  cards: WarCard[];
  avgElixir: number;
  avgLevel: number;
  score: number;
  substitutions: { out: string; in: string; reason: string }[];
  warnings: string[];
  note: string;
  source: string;
};

export type WarLineup = {
  decks: WarDeck[];
  score: number;
};

export type WarResult = {
  band: TrophyBand;
  bandSource: "override" | "trophies" | "league" | "default";
  /** The player's competitive card level (median of their 32 best cards). */
  ref: number;
  ownedCount: number;
  lineups: WarLineup[];
  /** Strongest owned cards no lineup deck uses — shown so the player can hand-swap. */
  unusedTop: { name: string; level: number }[];
  meta: { updated: string; season: string };
  notes: string[];
};

// ── Levels & bands ─────────────────────────────────────────────────────────

/**
 * The API's `level` is relative to the rarity's `maxLevel`: in Sept 2026 a
 * common caps at 16, rare 14, epic 11, legendary 8 (verified on a live
 * profile — a Goblin Barrel "level 9 / max 11" is an in-game 14). In-game
 * level = level + (cap − maxLevel), where `cap` is the game's top level —
 * the commons' maxLevel. Pass the cap inferred from the collection
 * (`levelCap`) so this keeps working when Supercell raises it again.
 */
export const DEFAULT_LEVEL_CAP = 16;

export function displayedLevel(card: Pick<PlayerCard, "level" | "maxLevel">, cap = DEFAULT_LEVEL_CAP): number {
  const max = typeof card.maxLevel === "number" ? card.maxLevel : cap;
  return Math.max(1, Math.round(card.level + Math.max(0, cap - max)));
}

/** The game's current max card level, read off the collection (commons carry it). */
export function levelCap(cards: Pick<PlayerCard, "maxLevel">[]): number {
  return cards.reduce((cap, c) => (typeof c.maxLevel === "number" && c.maxLevel > cap ? c.maxLevel : cap), DEFAULT_LEVEL_CAP);
}

export const BAND_ORDER: TrophyBand[] = ["low", "mid", "high", "top"];

/** Ladder thresholds (Trophy Road is capped at 14,000 since Feb 2026). */
export function bandFromTrophies(trophies: number | undefined, leagueNumber?: number): { band: TrophyBand; source: WarResult["bandSource"] } {
  // Path of Legends outranks trophies — a UC player parked at 9k is still top.
  if (typeof leagueNumber === "number" && leagueNumber >= 10) return { band: "top", source: "league" };
  if (typeof trophies !== "number") return { band: "mid", source: "default" };
  if (trophies >= 11000) return { band: "top", source: "trophies" };
  if (trophies >= 8000) return { band: "high", source: "trophies" };
  if (trophies >= 5000) return { band: "mid", source: "trophies" };
  return { band: "low", source: "trophies" };
}

// ── Collection indexing ────────────────────────────────────────────────────

/** Hero unlock detection — the API field isn't documented; accept any plausible flag. */
function hasHero(card: PlayerCard): boolean {
  const c = card as Record<string, unknown>;
  const candidates = [c.heroLevel, c.maxHeroLevel, c.hero, c.isHero, c.heroUnlocked];
  return candidates.some((v) => v === true || (typeof v === "number" && v > 0));
}

function rolesFor(name: string): CardRole[] {
  return CARD_ROLES[name]?.roles ?? lookupInfo(name)?.roles ?? [];
}

const ROLE_INDEX: Map<string, { name: string; info: (typeof CARD_ROLES)[string] }> = new Map(
  Object.entries(CARD_ROLES).map(([name, info]) => [normalizeCardName(name), { name, info }])
);

function lookupInfo(name: string) {
  return ROLE_INDEX.get(normalizeCardName(name))?.info;
}

/** Canonical (cardRoles.ts) spelling for a name, falling back to the input. */
function canonicalName(name: string): string {
  return ROLE_INDEX.get(normalizeCardName(name))?.name ?? baseCardName(name);
}

export function indexCollection(player: PlayerInput): Map<string, OwnedCard> {
  const owned = new Map<string, OwnedCard>();
  const cap = levelCap(player.cards ?? []);
  for (const raw of player.cards ?? []) {
    if (!raw?.name || typeof raw.level !== "number") continue;
    const key = normalizeCardName(raw.name);
    if (!key || owned.has(key)) continue;
    const info = lookupInfo(raw.name);
    owned.set(key, {
      name: raw.name,
      key,
      level: displayedLevel(raw, cap),
      elixir: typeof raw.elixirCost === "number" ? raw.elixirCost : info?.elixir ?? 4,
      evo: (raw.evolutionLevel ?? 0) > 0,
      hero: hasHero(raw),
      roles: info?.roles ?? [],
    });
  }
  return owned;
}

/** Median of the player's 32 best card levels — what their war decks can be built at. */
export function competitiveLevel(owned: Map<string, OwnedCard>): number {
  const levels = [...owned.values()].map((c) => c.level).sort((a, b) => b - a).slice(0, 32);
  if (levels.length === 0) return 11;
  const mid = Math.floor(levels.length / 2);
  return levels.length % 2 ? levels[mid] : (levels[mid - 1] + levels[mid]) / 2;
}

// ── Scoring ────────────────────────────────────────────────────────────────

const W = {
  tier: 40,
  band: 25,
  level: 35,
  /** Per-swap costs — a sub from the hand-written list vs. a generic same-role card. */
  subListed: 4,
  subListedStep: 0.5,
  subRole: 9,
  /** Swapping an owned-but-underleveled card for a stronger one. */
  levelSwap: 2,
  missingEvo: 2,
  /** Second deck of the same family in one lineup. */
  familyRepeat: 15,
};

const TIER_SCORE: Record<MetaDeck["tier"], number> = { S: 1, A: 0.8, B: 0.6 };

function bandFit(deck: MetaDeck, band: TrophyBand): number {
  if (deck.bands.includes(band)) return 1;
  const i = BAND_ORDER.indexOf(band);
  const adjacent = deck.bands.some((b) => Math.abs(BAND_ORDER.indexOf(b) - i) === 1);
  return adjacent ? 0.5 : 0.2;
}

/** 1.0 at the player's competitive level, 0 four levels under, small bonus above. */
export function levelScore(level: number, ref: number): number {
  if (level >= ref) return Math.min(1.15, 1 + 0.05 * (level - ref));
  return Math.max(0, 1 - (ref - level) / 4);
}

// ── Realizing one template against a collection ────────────────────────────

type Slot = {
  template: string;
  base: string;
  key: string;
  evoWanted: boolean;
  heroWanted: boolean;
  isWincon: boolean;
};

function slotsOf(deck: MetaDeck): Slot[] {
  return deck.cards.map((template) => {
    const base = canonicalName(template);
    return {
      template,
      base,
      key: normalizeCardName(base),
      evoWanted: wantsEvo(template),
      heroWanted: wantsHero(template),
      isWincon: rolesFor(base)[0] === "wincon",
    };
  });
}

/** Ordered candidate replacements for a card: listed subs first, then same-role cards. */
function substitutes(base: string): { name: string; cost: number }[] {
  const info = lookupInfo(base);
  const out: { name: string; cost: number }[] = [];
  const seen = new Set<string>([normalizeCardName(base)]);
  (info?.subs ?? []).forEach((s, i) => {
    const k = normalizeCardName(s);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ name: s, cost: W.subListed + i * W.subListedStep });
  });
  const primary = info?.roles?.[0];
  if (primary) {
    for (const s of ROLE_FALLBACKS[primary] ?? []) {
      const k = normalizeCardName(s);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ name: s, cost: W.subRole });
    }
  }
  return out;
}

/**
 * Rebuild one meta deck from what the player owns, avoiding `used` (cards
 * already spent in other war decks). Returns null when a slot cannot be
 * filled at all.
 */
export function realizeDeck(
  deck: MetaDeck,
  owned: Map<string, OwnedCard>,
  ref: number,
  band: TrophyBand,
  used: Set<string> = new Set()
): WarDeck | null {
  const slots = slotsOf(deck);
  const inDeck = new Set<string>();
  const chosen: (WarCard | null)[] = new Array(slots.length).fill(null);
  const substitutions: WarDeck["substitutions"] = [];
  const warnings: string[] = [];
  let cost = 0;

  const take = (c: OwnedCard, slot: Slot, replaces?: string, reason?: string): WarCard => {
    inDeck.add(c.key);
    return { name: c.name, label: c.name, level: c.level, elixir: c.elixir, evo: false, hero: false, replaces, reason };
  };

  // Pass 1 — keep every template card the player owns and hasn't used elsewhere.
  slots.forEach((slot, i) => {
    const c = owned.get(slot.key);
    if (c && !used.has(c.key) && !inDeck.has(c.key)) chosen[i] = take(c, slot);
  });

  // Pass 2 — fill the gaps with substitutes; also upgrade badly underleveled keeps.
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const current = chosen[i];
    const currentOwned = current ? owned.get(normalizeCardName(current.name)) : undefined;
    const currentUnderleveled = !!currentOwned && currentOwned.level <= ref - 3;
    if (current && !currentUnderleveled) continue;

    let best: { c: OwnedCard; cost: number; reason: string } | null = null;
    for (const sub of substitutes(slot.base)) {
      const c = owned.get(normalizeCardName(sub.name));
      if (!c || used.has(c.key) || inDeck.has(c.key)) continue;
      // An underleveled keep only gives way to something clearly stronger.
      if (currentOwned && c.level < currentOwned.level + 2) continue;
      const value = W.level * levelScore(c.level, ref) * (slot.isWincon ? 2 : 1) / 8 - sub.cost;
      const bestValue = best ? W.level * levelScore(best.c.level, ref) * (slot.isWincon ? 2 : 1) / 8 - best.cost : -Infinity;
      if (value > bestValue) {
        const reason = currentOwned
          ? `${currentOwned.name} is level ${currentOwned.level}; ${c.name} is ${c.level}`
          : owned.has(slot.key)
          ? `${slot.base} is already in another war deck`
          : `you don't have ${slot.base}`;
        best = { c, cost: currentOwned ? W.levelSwap : sub.cost, reason };
      }
    }
    if (best) {
      if (current) inDeck.delete(normalizeCardName(current.name));
      chosen[i] = take(best.c, slot, slot.base, best.reason);
      substitutions.push({ out: slot.base, in: best.c.name, reason: best.reason });
      cost += best.cost;
    } else if (!current) {
      return null; // nothing owned can do this job
    }
  }

  const cards = chosen as WarCard[];

  // Evolutions / heroes: honour the template's asks when the player has them,
  // and promote extra evos the player owns while slots remain (1 evo + 1 hero +
  // 1 wild per deck since March 2026 → at most 2 evos, at most 2 heroes, ≤ 3 total).
  let evoCount = 0;
  let heroCount = 0;
  const special = () => evoCount + heroCount;
  cards.forEach((card, i) => {
    const o = owned.get(normalizeCardName(card.name));
    const slot = slots[i];
    if (!o) return;
    if (slot.heroWanted && !card.replaces) {
      if (o.hero && heroCount < 2 && special() < 3) {
        card.hero = true;
        heroCount++;
      } else if (!o.hero) {
        warnings.push(`${card.name}: the deck wants the Hero version — use it if you've unlocked it`);
      }
    }
    if (slot.evoWanted && !card.replaces) {
      if (o.evo && evoCount < 2 && special() < 3) {
        card.evo = true;
        evoCount++;
      } else if (!o.evo) {
        warnings.push(`No evolution for ${card.name} yet — the deck still works, it just hits softer`);
        cost += W.missingEvo;
      }
    }
  });
  // Promote owned evolutions the template didn't ask for, strongest cards first.
  [...cards]
    .sort((a, b) => b.level - a.level)
    .forEach((card) => {
      if (card.evo || evoCount >= 2 || special() >= 3) return;
      const o = owned.get(normalizeCardName(card.name));
      if (o?.evo) {
        card.evo = true;
        evoCount++;
      }
    });
  for (const card of cards) card.label = card.evo ? `Evo ${card.name}` : card.hero ? `Hero ${card.name}` : card.name;

  const avgElixir = round1(cards.reduce((s, c) => s + c.elixir, 0) / cards.length);
  const avgLevel = round1(cards.reduce((s, c) => s + c.level, 0) / cards.length);
  const weightedLevel =
    cards.reduce((s, c, i) => s + levelScore(c.level, ref) * (slots[i].isWincon ? 2 : 1), 0) /
    cards.reduce((s, _c, i) => s + (slots[i].isWincon ? 2 : 1), 0);

  const score = round1(W.tier * TIER_SCORE[deck.tier] + W.band * bandFit(deck, band) + W.level * weightedLevel - cost);

  return {
    templateId: deck.id,
    name: deck.name,
    family: deck.family,
    tier: deck.tier,
    cards,
    avgElixir,
    avgLevel,
    score,
    substitutions,
    warnings,
    note: deck.note,
    source: deck.source,
  };
}

// ── Lineup search ──────────────────────────────────────────────────────────

const deckKeys = (d: WarDeck) => d.cards.map((c) => normalizeCardName(c.name));

function lineupScore(decks: WarDeck[]): number {
  const families = new Set<DeckFamily>();
  let repeats = 0;
  for (const d of decks) {
    if (families.has(d.family)) repeats++;
    families.add(d.family);
  }
  return round1(decks.reduce((s, d) => s + d.score, 0) - repeats * W.familyRepeat);
}

/** Best next deck given what's already in the lineup (cards + families). */
function bestNext(
  lineup: WarDeck[],
  templates: MetaDeck[],
  owned: Map<string, OwnedCard>,
  ref: number,
  band: TrophyBand,
  exclude: Set<string>
): WarDeck | null {
  const used = new Set(lineup.flatMap(deckKeys));
  const families = new Set(lineup.map((d) => d.family));
  let best: { deck: WarDeck; value: number } | null = null;
  for (const t of templates) {
    if (exclude.has(t.id) || lineup.some((d) => d.templateId === t.id)) continue;
    const realized = realizeDeck(t, owned, ref, band, used);
    if (!realized) continue;
    const value = realized.score - (families.has(t.family) ? W.familyRepeat : 0);
    if (!best || value > best.value) best = { deck: realized, value };
  }
  return best?.deck ?? null;
}

/** One pass of "replace deck i with anything better given the other three". */
function improve(
  lineup: WarDeck[],
  templates: MetaDeck[],
  owned: Map<string, OwnedCard>,
  ref: number,
  band: TrophyBand
): WarDeck[] {
  let current = lineup;
  for (let i = 0; i < current.length; i++) {
    const others = current.filter((_d, j) => j !== i);
    const candidate = bestNext(others, templates, owned, ref, band, new Set([current[i].templateId]));
    if (candidate) {
      const next = [...others.slice(0, i), candidate, ...others.slice(i)];
      if (lineupScore(next) > lineupScore(current)) current = next;
    }
  }
  return current;
}

export type BuildOptions = {
  band?: TrophyBand;
  /** How many distinct lineups to return (default 3). */
  lineups?: number;
  /** Decks per lineup (Clan War = 4). */
  size?: number;
  templates?: MetaDeck[];
};

export function buildWarLineups(player: PlayerInput, opts: BuildOptions = {}): WarResult {
  const size = opts.size ?? 4;
  const wanted = opts.lineups ?? 3;
  const templates = opts.templates ?? META_DECKS;
  const owned = indexCollection(player);
  const ref = competitiveLevel(owned);
  const detected = bandFromTrophies(player.trophies, player.leagueNumber);
  const band = opts.band ?? detected.band;
  const bandSource: WarResult["bandSource"] = opts.band ? "override" : detected.source;
  const notes: string[] = [];

  // Seeds: the strongest standalone decks, one per family, so the search
  // starts from genuinely different places.
  const standalone = templates
    .map((t) => realizeDeck(t, owned, ref, band))
    .filter((d): d is WarDeck => !!d)
    .sort((a, b) => b.score - a.score);

  if (standalone.length === 0) {
    notes.push("Not enough cards to build a war deck from the current meta.");
    return { band, bandSource, ref, ownedCount: owned.size, lineups: [], unusedTop: [], meta: { updated: META_SNAPSHOT.updated, season: META_SNAPSHOT.season }, notes };
  }

  const seeds: WarDeck[] = [];
  const seedFamilies = new Set<DeckFamily>();
  for (const d of standalone) {
    if (seedFamilies.has(d.family)) continue;
    seedFamilies.add(d.family);
    seeds.push(d);
    if (seeds.length >= 8) break;
  }

  const seen = new Set<string>();
  const lineups: WarLineup[] = [];
  for (const seed of seeds) {
    // Re-realize the seed against an empty used-set (it already is), then grow.
    let lineup: WarDeck[] = [seed];
    while (lineup.length < size) {
      const next = bestNext(lineup, templates, owned, ref, band, new Set());
      if (!next) break;
      lineup.push(next);
    }
    lineup = improve(lineup, templates, owned, ref, band);
    const key = lineup.map((d) => d.templateId).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    lineups.push({ decks: lineup, score: lineupScore(lineup) });
  }
  lineups.sort((a, b) => b.score - a.score || b.decks.length - a.decks.length);
  const top = lineups.slice(0, wanted);

  const best = top[0];
  if (best && best.decks.length < size) {
    notes.push(`Only ${best.decks.length} of ${size} war decks could be built without repeating a card — level a few more cards to fill the lineup.`);
  }
  if (best && new Set(best.decks.map((d) => d.family)).size < best.decks.length) {
    notes.push("Two decks share an archetype — the collection didn't allow four distinct ones at good levels.");
  }

  const usedKeys = new Set(best ? best.decks.flatMap(deckKeys) : []);
  const unusedTop = [...owned.values()]
    .filter((c) => !usedKeys.has(c.key))
    .sort((a, b) => b.level - a.level)
    .slice(0, 8)
    .map((c) => ({ name: c.name, level: c.level }));

  return {
    band,
    bandSource,
    ref,
    ownedCount: owned.size,
    lineups: top,
    unusedTop,
    meta: { updated: META_SNAPSHOT.updated, season: META_SNAPSHOT.season },
    notes,
  };
}

// ── Validation (used on Gemini's output too) ───────────────────────────────

export type LineupProblem = string;

/** Every card owned, no card twice across decks, exactly 8 per deck. */
export function validateLineup(decks: { cards: { name: string }[] }[], owned: Map<string, OwnedCard>): LineupProblem[] {
  const problems: LineupProblem[] = [];
  const seen = new Map<string, number>();
  decks.forEach((d, i) => {
    if (d.cards.length !== 8) problems.push(`deck ${i + 1} has ${d.cards.length} cards`);
    for (const c of d.cards) {
      const k = normalizeCardName(c.name);
      if (!owned.has(k)) problems.push(`deck ${i + 1}: ${c.name} is not in the collection`);
      const prev = seen.get(k);
      if (prev !== undefined) problems.push(`${c.name} appears in deck ${prev + 1} and deck ${i + 1}`);
      seen.set(k, i);
    }
  });
  return problems;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
