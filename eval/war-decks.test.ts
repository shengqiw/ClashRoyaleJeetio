/**
 * War Decks engine tests — `npm test` (node:test via tsx, no network).
 *
 * These pin the hard constraints Gemini is never allowed to break: every card
 * owned, no card in two war decks, distinct archetype families when the
 * collection allows it, and the level math the whole thing rests on.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bandFromTrophies,
  buildWarLineups,
  competitiveLevel,
  displayedLevel,
  indexCollection,
  levelCap,
  validateLineup,
  type PlayerCard,
} from "../src/lib/warDecks";
import { CARD_ROLES } from "../src/data/cardRoles";
import { META_DECKS } from "../src/data/metaDecks";
import { normalizeCardName } from "../src/lib/cardName";

const ALL = Object.keys(CARD_ROLES);

/** Rarity-relative API level for a wanted in-game level (cap 16: common 16, rare 14, epic 11, legendary 8). */
const apiCard = (name: string, level: number, maxLevel = 16, extra: Partial<PlayerCard> = {}): PlayerCard => ({
  name,
  level: level - (16 - maxLevel),
  maxLevel,
  elixirCost: CARD_ROLES[name]?.elixir ?? 4,
  ...extra,
});

test("displayedLevel converts rarity-relative API levels (live shapes, Sept 2026)", () => {
  assert.equal(displayedLevel({ level: 14, maxLevel: 16 }), 14); // common Knight 14/16
  assert.equal(displayedLevel({ level: 12, maxLevel: 14 }), 14); // rare Dart Goblin 12/14
  assert.equal(displayedLevel({ level: 9, maxLevel: 11 }), 14); // epic Goblin Barrel 9/11
  assert.equal(displayedLevel({ level: 7, maxLevel: 8 }), 15); // legendary Princess 7/8
  assert.equal(displayedLevel({ level: 16, maxLevel: 16 }), 16); // maxed common
  assert.equal(displayedLevel({ level: 1, maxLevel: 8 }), 9); // fresh legendary
  assert.equal(displayedLevel({ level: 13 }), 13); // already normalized / unknown rarity
  // Pre-2026 shape (cap 14) still works when the cap is passed explicitly.
  assert.equal(displayedLevel({ level: 6, maxLevel: 6 }, 14), 14);
  assert.equal(levelCap([{ maxLevel: 11 }, { maxLevel: 16 }, { maxLevel: 8 }]), 16);
  assert.equal(levelCap([{ maxLevel: 11 }]), 16); // never below the known cap
});

test("bandFromTrophies thresholds and league override", () => {
  assert.equal(bandFromTrophies(4200).band, "low");
  assert.equal(bandFromTrophies(6500).band, "mid");
  assert.equal(bandFromTrophies(9000).band, "high");
  assert.equal(bandFromTrophies(12000).band, "top");
  assert.equal(bandFromTrophies(9000, 10).band, "top");
  assert.equal(bandFromTrophies(undefined).source, "default");
});

test("every meta template card has a role entry (so substitution can reason about it)", () => {
  const known = new Set(ALL.map(normalizeCardName));
  const missing = new Set<string>();
  for (const d of META_DECKS) for (const c of d.cards) if (!known.has(normalizeCardName(c))) missing.add(c);
  assert.deepEqual([...missing], []);
  for (const d of META_DECKS) {
    assert.equal(d.cards.length, 8, `${d.id} has ${d.cards.length} cards`);
    assert.equal(new Set(d.cards.map(normalizeCardName)).size, 8, `${d.id} repeats a card`);
  }
});

test("maxed full collection → 4 decks, 32 unique cards, 4 families", () => {
  const cards = ALL.map((n, i) => apiCard(n, 14, 14, { evolutionLevel: i % 4 === 0 ? 1 : 0 }));
  const res = buildWarLineups({ trophies: 12500, cards });
  assert.equal(res.band, "top");
  assert.ok(res.lineups.length >= 1);
  const best = res.lineups[0];
  assert.equal(best.decks.length, 4);
  assert.deepEqual(validateLineup(best.decks, indexCollection({ cards })), []);
  assert.equal(new Set(best.decks.map((d) => d.family)).size, 4, "families should be distinct");
  for (const d of best.decks) {
    assert.ok(d.cards.filter((c) => c.evo).length <= 2, `${d.name} has too many evos`);
    assert.ok(d.cards.filter((c) => c.evo || c.hero).length <= 3, `${d.name} exceeds special slots`);
  }
});

test("mid-ladder account: substitutions are owned, explained, and never duplicated", () => {
  // ~75 cards, levels 9–13, no champions, a couple of evos, holes in the collection.
  const champions = ["Goblinstein", "Archer Queen", "Golden Knight", "Mighty Miner", "Boss Bandit", "Little Prince", "Monk", "Skeleton King", "Ronin", "Minion Giant", "Vines", "Cannon Cart"];
  const pool = ALL.filter((n, i) => !champions.includes(n) && i % 3 !== 1); // ~2/3 of the roster, all roles represented
  const cards = pool.map((n, i) => apiCard(n, 9 + (i % 5), 14, { evolutionLevel: n === "Knight" || n === "Skeletons" ? 1 : 0 }));
  const res = buildWarLineups({ trophies: 6200, cards });
  assert.equal(res.band, "mid");
  const owned = indexCollection({ cards });
  const best = res.lineups[0];
  assert.equal(best.decks.length, 4);
  assert.deepEqual(validateLineup(best.decks, owned), []);
  const subs = best.decks.flatMap((d) => d.substitutions);
  assert.ok(subs.length > 0, "a partial collection must force some swaps");
  for (const s of subs) {
    assert.ok(owned.has(normalizeCardName(s.in)), `${s.in} not owned`);
    assert.ok(s.reason.length > 0);
  }
  for (const d of best.decks) for (const c of d.cards) if (c.evo) assert.ok(owned.get(normalizeCardName(c.name))?.evo, `${c.name} promoted to evo without owning it`);
});

test("underleveled owned card gives way to a much stronger same-role card", () => {
  const cards = ALL.map((n) => apiCard(n, n === "Musketeer" ? 8 : n === "Archers" ? 14 : 13));
  const owned = indexCollection({ cards });
  const ref = competitiveLevel(owned);
  assert.ok(ref >= 13);
  const hog = META_DECKS.find((d) => d.id === "hog-26-classic")!;
  const res = buildWarLineups({ trophies: 7000, cards, }, { templates: [hog], lineups: 1, size: 1 });
  const deck = res.lineups[0].decks[0];
  const names = deck.cards.map((c) => c.name);
  assert.ok(!names.includes("Musketeer"), "level-8 Musketeer should be swapped out");
  assert.ok(names.includes("Archers"), "level-14 Archers should replace it");
  assert.ok(deck.substitutions.some((s) => s.out === "Musketeer" && s.in === "Archers"));
});

test("tiny collection → fewer decks and an explanatory note", () => {
  const cards = ALL.slice(0, 20).map((n) => apiCard(n, 11));
  const res = buildWarLineups({ trophies: 3000, cards });
  const best = res.lineups[0];
  assert.ok(!best || best.decks.length < 4);
  assert.ok(res.notes.some((n) => /Only \d of 4|Not enough cards/.test(n)));
});

test("overlap repair: the second deck never reuses the first deck's spells", () => {
  const cards = ALL.map((n) => apiCard(n, 14));
  const res = buildWarLineups({ trophies: 9000, cards }, { lineups: 1 });
  const seen = new Set<string>();
  for (const d of res.lineups[0].decks) {
    for (const c of d.cards) {
      const k = normalizeCardName(c.name);
      assert.ok(!seen.has(k), `${c.name} used twice`);
      seen.add(k);
    }
  }
});
