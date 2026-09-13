/**
 * War Decks advisor — the Gemini layer on top of warDecks.ts.
 *
 * The engine proposes a few complete, constraint-valid lineups. Gemini's job:
 * pick the one a good coach would hand this player, order the decks for war
 * (duel sequence + which to keep for 1v1/boat), explain each pick in one
 * sentence the player can act on, and optionally swap a card or two — but only
 * from cards the player owns that no war deck is using. Every swap is checked
 * here; anything that breaks a rule is dropped, never trusted.
 *
 * With no GEMINI_API_KEY (or a quota miss) the engine's top lineup ships with
 * canned coaching, and the response says so — the feature never goes dark.
 */
import { META_SNAPSHOT } from "../data/metaDecks";
import { CARD_ROLES } from "../data/cardRoles";
import { normalizeCardName } from "./cardName";
import { generateJson, geminiConfigured, geminiModel, type GeminiSchema } from "./gemini";
import { validateLineup, type OwnedCard, type WarDeck, type WarLineup, type WarResult } from "./warDecks";

export type WarRole = "Duel opener" | "Duel second" | "Duel closer" | "1v1 / boat";
export const WAR_ROLES: WarRole[] = ["Duel opener", "Duel second", "Duel closer", "1v1 / boat"];

export type CoachedDeck = WarDeck & {
  warRole: WarRole;
  why: string;
  howToPlay: string;
};

export type AdvisorOutcome = {
  decks: CoachedDeck[];
  summary: string;
  advisor: { used: boolean; model: string; ms?: number; reason?: string; lineupIndex: number; swapsApplied: number };
};

type GeminiReply = {
  lineupIndex: number;
  summary: string;
  decks: { deckIndex: number; warRole: WarRole; why: string; howToPlay: string }[];
  swaps?: { deckIndex: number; out: string; in: string; why: string }[];
};

const REPLY_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  required: ["lineupIndex", "summary", "decks"],
  properties: {
    lineupIndex: { type: "INTEGER", description: "0-based index of the chosen candidate lineup" },
    summary: { type: "STRING", description: "Two plain-English sentences to the player about this lineup" },
    decks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["deckIndex", "warRole", "why", "howToPlay"],
        properties: {
          deckIndex: { type: "INTEGER", description: "0-based index of the deck inside the chosen lineup" },
          warRole: { type: "STRING", enum: WAR_ROLES },
          why: { type: "STRING", description: "One sentence: why this deck, for this player, this week" },
          howToPlay: { type: "STRING", description: "One sentence of play advice, max 30 words" },
        },
      },
    },
    swaps: {
      type: "ARRAY",
      description: "Optional card swaps, only from the player's unused cards list",
      items: {
        type: "OBJECT",
        required: ["deckIndex", "out", "in", "why"],
        properties: {
          deckIndex: { type: "INTEGER" },
          out: { type: "STRING" },
          in: { type: "STRING" },
          why: { type: "STRING" },
        },
      },
    },
  },
};

const SYSTEM = `You are the war-deck coach for Jeetio, a Clash Royale clan site. A rules engine has already built candidate Clan War lineups (4 decks, 32 different cards, all owned by the player, built from this week's meta at the player's card levels). You do NOT invent decks or cards. You:
1. Pick the candidate lineup a strong coach would hand this player (favour higher card levels on win conditions, archetype variety, and decks that are winning at the player's trophy band this week).
2. Assign war roles: "Duel opener" (most flexible deck), "Duel second", "Duel closer" (the deck that closes out or steals a game), "1v1 / boat" (safest deck). Use each role exactly once.
3. Write one honest sentence per deck on why it fits THIS player (mention levels or the meta trend that matters) and one short sentence on how to play it.
4. Optionally propose up to 3 card swaps, ONLY using cards from the "unused cards" list, and only when the swap clearly improves the deck (a much higher level, or a better fit for the deck's job). Never swap a win condition for a non-win condition. Never reuse a card across decks.
Plain English, no hype, no emojis. Card names exactly as given.`;

const CANNED_ROLES: WarRole[] = ["Duel opener", "Duel second", "Duel closer", "1v1 / boat"];

/** The template's play note, unless the win condition got swapped — then the note would coach the wrong card. */
function cannedHow(d: WarDeck): string {
  const winconSwap = d.substitutions.find((s) => CARD_ROLES[s.out]?.roles?.[0] === "wincon");
  if (!winconSwap) return d.note;
  return `${winconSwap.in} is your win condition here instead of ${winconSwap.out}; the rest of the deck defends the way ${d.name} does.`;
}

function cannedWhy(d: WarDeck, band: string): string {
  const tier = d.tier === "S" ? "an S-tier" : d.tier === "A" ? "an A-tier" : "a solid";
  const levels = `your cards average level ${d.avgLevel}`;
  const swaps = d.substitutions.length ? `, adapted with ${d.substitutions.length} swap${d.substitutions.length > 1 ? "s" : ""} to what you own` : "";
  return `${d.name} is ${tier} ${d.family} deck at ${band} ladder this week; ${levels}${swaps}.`;
}

/** Deterministic coaching when Gemini isn't available. */
export function cannedOutcome(result: WarResult, reason: string): AdvisorOutcome {
  const lineup = result.lineups[0];
  const decks = (lineup?.decks ?? []).map((d, i) => ({
    ...d,
    warRole: CANNED_ROLES[i] ?? "1v1 / boat",
    why: cannedWhy(d, result.band),
    howToPlay: cannedHow(d),
  }));
  return {
    decks,
    summary:
      decks.length === 4
        ? `Four decks, four archetypes, no card repeated — built from the ${result.meta.season} meta at your card levels (competitive level ${result.ref}).`
        : `Built ${decks.length} deck${decks.length === 1 ? "" : "s"} from what you own at good levels; level a few more cards to fill all four war slots.`,
    advisor: { used: false, model: geminiModel(), reason, lineupIndex: 0, swapsApplied: 0 },
  };
}

function describeLineup(l: WarLineup, idx: number): string {
  const decks = l.decks
    .map((d, i) => {
      const cards = d.cards.map((c) => `${c.label} L${c.level}`).join(", ");
      const swaps = d.substitutions.length ? ` | swaps: ${d.substitutions.map((s) => `${s.out}→${s.in}`).join(", ")}` : "";
      const warn = d.warnings.length ? ` | notes: ${d.warnings.join("; ")}` : "";
      return `  deck ${i}: ${d.name} [${d.family}, tier ${d.tier}, avg ${d.avgElixir} elixir, avg level ${d.avgLevel}, score ${d.score}]\n    cards: ${cards}${swaps}${warn}`;
    })
    .join("\n");
  return `lineup ${idx} (score ${l.score}):\n${decks}`;
}

export function buildPrompt(result: WarResult, owned: Map<string, OwnedCard>, player: { name?: string; trophies?: number; expLevel?: number }): string {
  const lineupUsed = new Set(result.lineups.flatMap((l) => l.decks.flatMap((d) => d.cards.map((c) => normalizeCardName(c.name)))));
  const unused = [...owned.values()]
    .filter((c) => !lineupUsed.has(c.key))
    .sort((a, b) => b.level - a.level)
    .slice(0, 24)
    .map((c) => `${c.name} L${c.level}${c.evo ? " (evo)" : ""} [${(CARD_ROLES[c.name]?.roles ?? c.roles).join("/")}]`)
    .join(", ");
  const menace = META_SNAPSHOT.menace[result.band]?.join(", ");
  return [
    `PLAYER: ${player.name ?? "unknown"} · ${player.trophies ?? "?"} trophies (${result.band} band) · king level ${player.expLevel ?? "?"} · competitive card level ${result.ref} · ${result.ownedCount} cards owned`,
    ``,
    `META (${META_SNAPSHOT.season}, snapshot ${META_SNAPSHOT.updated}):`,
    ...META_SNAPSHOT.trends.map((t) => `- ${t}`),
    `Cards dominating the ${result.band} band right now: ${menace}.`,
    ``,
    `CANDIDATE LINEUPS (choose one by index):`,
    ...result.lineups.map(describeLineup),
    ``,
    `UNUSED CARDS the player owns (the only cards you may swap in): ${unused || "none"}`,
    ``,
    `Clan War rules: each of the 4 decks is played with the player's real card levels; a card may appear in only one of the 4 decks; a deck used in a battle is locked until the next war day. Duels are best-of-3 with three different decks.`,
  ].join("\n");
}

/** Apply Gemini's swaps that survive validation; returns count applied. */
function applySwaps(decks: WarDeck[], swaps: GeminiReply["swaps"], owned: Map<string, OwnedCard>): number {
  if (!Array.isArray(swaps)) return 0;
  let applied = 0;
  for (const s of swaps.slice(0, 3)) {
    const deck = decks[s.deckIndex];
    if (!deck || typeof s.out !== "string" || typeof s.in !== "string") continue;
    const outKey = normalizeCardName(s.out);
    const inKey = normalizeCardName(s.in);
    const inCard = owned.get(inKey);
    const slot = deck.cards.findIndex((c) => normalizeCardName(c.name) === outKey);
    if (!inCard || slot === -1 || outKey === inKey) continue;
    // Not already in any deck of this lineup.
    if (decks.some((d) => d.cards.some((c) => normalizeCardName(c.name) === inKey))) continue;
    // Must do a comparable job: share a role, or be a listed substitute either way.
    const outInfo = CARD_ROLES[deck.cards[slot].name];
    const inInfo = CARD_ROLES[inCard.name];
    const shareRole = (outInfo?.roles ?? []).some((r) => (inInfo?.roles ?? []).includes(r));
    const listed = (outInfo?.subs ?? []).map(normalizeCardName).includes(inKey) || (inInfo?.subs ?? []).map(normalizeCardName).includes(outKey);
    if (!shareRole && !listed) continue;
    // Never trade the win condition away for a non-win-condition.
    if (outInfo?.roles?.[0] === "wincon" && inInfo?.roles?.[0] !== "wincon") continue;

    const out = deck.cards[slot];
    deck.cards[slot] = {
      name: inCard.name,
      label: inCard.name,
      level: inCard.level,
      elixir: inCard.elixir,
      evo: false,
      hero: false,
      replaces: out.name,
      reason: `coach: ${s.why}`,
    };
    deck.substitutions.push({ out: out.name, in: inCard.name, reason: `coach: ${s.why}` });
    deck.avgElixir = Math.round((deck.cards.reduce((a, c) => a + c.elixir, 0) / deck.cards.length) * 10) / 10;
    deck.avgLevel = Math.round((deck.cards.reduce((a, c) => a + c.level, 0) / deck.cards.length) * 10) / 10;
    applied++;
  }
  return applied;
}

/** Run Gemini over the engine's lineups; falls back to canned coaching on any failure. */
export async function coachLineups(
  result: WarResult,
  owned: Map<string, OwnedCard>,
  player: { name?: string; trophies?: number; expLevel?: number },
  trace?: string
): Promise<AdvisorOutcome> {
  if (result.lineups.length === 0) return cannedOutcome(result, "no lineup to coach");
  if (!geminiConfigured()) return cannedOutcome(result, "GEMINI_API_KEY not set — rule-based picks only");

  const reply = await generateJson<GeminiReply>({
    system: SYSTEM,
    prompt: buildPrompt(result, owned, player),
    schema: REPLY_SCHEMA,
    temperature: 0.4,
    maxOutputTokens: 2048,
    timeoutMs: 25_000,
    trace,
  });
  if (!reply.ok) return cannedOutcome(result, reply.reason);

  const r = reply.data;
  const lineup = result.lineups[Number.isInteger(r.lineupIndex) ? r.lineupIndex : 0] ?? result.lineups[0];
  const lineupIndex = result.lineups.indexOf(lineup);
  // Deep-copy the decks so swaps don't mutate the engine's result.
  const decks: WarDeck[] = lineup.decks.map((d) => ({ ...d, cards: d.cards.map((c) => ({ ...c })), substitutions: [...d.substitutions], warnings: [...d.warnings] }));
  const swapsApplied = applySwaps(decks, r.swaps, owned);
  if (validateLineup(decks, owned).length > 0) {
    // Should be impossible after applySwaps' checks; belt and braces.
    return cannedOutcome(result, "coach output failed validation");
  }

  const rolesLeft = new Set<WarRole>(WAR_ROLES);
  const annotated = new Map<number, { warRole: WarRole; why: string; howToPlay: string }>();
  for (const d of Array.isArray(r.decks) ? r.decks : []) {
    if (!Number.isInteger(d.deckIndex) || !decks[d.deckIndex] || annotated.has(d.deckIndex)) continue;
    const role = WAR_ROLES.includes(d.warRole) && rolesLeft.has(d.warRole) ? d.warRole : undefined;
    annotated.set(d.deckIndex, {
      warRole: role ?? ([...rolesLeft][0] ?? "1v1 / boat"),
      why: typeof d.why === "string" && d.why.trim() ? d.why.trim() : cannedWhy(decks[d.deckIndex], result.band),
      howToPlay: typeof d.howToPlay === "string" && d.howToPlay.trim() ? d.howToPlay.trim() : cannedHow(decks[d.deckIndex]),
    });
    rolesLeft.delete(annotated.get(d.deckIndex)!.warRole);
  }
  const coached: CoachedDeck[] = decks.map((d, i) => {
    const a = annotated.get(i);
    const role = a?.warRole ?? ([...rolesLeft][0] ?? "1v1 / boat");
    if (!a) rolesLeft.delete(role);
    return { ...d, warRole: role, why: a?.why ?? cannedWhy(d, result.band), howToPlay: a?.howToPlay ?? cannedHow(d) };
  });
  // Present in war order: opener, second, closer, 1v1.
  coached.sort((a, b) => WAR_ROLES.indexOf(a.warRole) - WAR_ROLES.indexOf(b.warRole));

  return {
    decks: coached,
    summary: typeof r.summary === "string" && r.summary.trim() ? r.summary.trim() : cannedOutcome(result, "").summary,
    advisor: { used: true, model: reply.model, ms: reply.ms, lineupIndex, swapsApplied },
  };
}
