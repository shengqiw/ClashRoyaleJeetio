/**
 * Meta snapshot for the War Decks engine — a dated, hand-curated list of the
 * decks that are actually winning right now, plus the playstyle notes the
 * community is talking about. The engine scores these against a player's card
 * levels; Gemini gets `trends` as context when it writes the reasoning.
 *
 * HOW TO REFRESH (a Claude session, ideally weekly after the balance patch):
 *   1. Pull the 7-day popular decks from RoyaleAPI for ranked (UC), GC, CC and
 *      a couple of ladder trophy windows; skim Deckshop / creator videos / the
 *      subreddit for what people are complaining about.
 *   2. Replace `decks` with the top ~25 by win rate × usage, keeping band
 *      coverage (every band needs cycle, beatdown, bait, control + air options)
 *      and a few no-evo/no-hero "F2P classics" so low-level accounts still get
 *      full lineups.
 *   3. Update `updated`, `season`, `trends`, `sources`. Bump nothing else.
 *
 * Card naming: Supercell catalog names. "Evo X" = the evolution is part of the
 * deck's identity; "Hero X" = the hero variant. Both degrade to the base card
 * when the player hasn't unlocked them (the engine strips the prefix).
 *
 * `family` is what "distinct archetypes" means to the lineup search: no two
 * war decks share a family unless nothing else fits.
 */

export type TrophyBand = "low" | "mid" | "high" | "top";

export type DeckFamily =
  | "cycle"
  | "beatdown"
  | "bait"
  | "siege"
  | "bridge"
  | "control"
  | "air"
  | "hogs"
  | "midrange";

export type MetaDeck = {
  id: string;
  name: string;
  family: DeckFamily;
  tier: "S" | "A" | "B";
  /** Bands where this deck is a proven pick; others still allowed at a penalty. */
  bands: TrophyBand[];
  cards: [string, string, string, string, string, string, string, string];
  source: string;
  /** One line the UI can show: why it wins / how to play it. */
  note: string;
};

export const META_SNAPSHOT = {
  updated: "2026-09-12",
  season: "Season 87 · Minion Academy (Sept 2026)",
  sources: [
    "RoyaleAPI popular decks, 7-day windows (ranked/UC, GC, CC, ladder 8k–14k), fetched 2026-09-12",
    "RoyaleAPI + Supercell Season 87 balance notes (6–8 Sep 2026) and Season 86 notes (31 Jul 2026)",
    "Deckshop new-meta list (Aug 2026), Dexerto card tier list (11 Sep 2026), TrophyCoach meta + clan-war guides (29 Aug 2026)",
    "Creator chatter (Ian77, CWA, SirTag video titles, week of 7 Sep 2026)",
  ],
  /** Plain-English trend lines — shown to the player and fed to Gemini. */
  trends: [
    "Minion Giant (new 4-elixir flying building-hitter) is the week-one menace: top card win rate in ranked and in 5 of the 6 best Grand Challenge decks.",
    "Evo Mortar + Cannon Cart (with Goblinstein or Hero Berserker) is the #1 deck at the top of ladder and in challenges.",
    "Giant Skeleton + Evo Battle Ram + Hero Wizard + Mother Witch is the most-played deck in Ultimate Champion — the current ladder bully.",
    "Heroes and Champions lost their ability cooldowns in August: every ability is now one shot per deployment, so timing the hero matters more than the card.",
    "Freeze was nerfed to 3.5s and Fireball's tower damage was cut this month — Freeze-Balloon and spell-cycle decks got weaker.",
    "Evo Elite Barbarians still farm mid ladder (≈66% win rate at 5–6k) even after the September spear/rage nerf; keep a hard counter (P.E.K.K.A, Inferno, buildings) in at least one war deck.",
    "Hog 2.6 (Hero Musketeer or Mighty Miner + Evo Cannon) is the most reliable climber from 8k to 14k trophies.",
    "Beatdown is back: Golem + Hero Mini P.E.K.K.A + Night Witch/Phoenix is #1 in Classic Challenge.",
    "Spirits lost 6% HP in August, so control decks (Graveyard Ice Wiz Tornado, Miner Poison) have room again.",
    "Small spells are the war bottleneck: Barbarian Barrel, Fireball, The Log and Arrows sit in almost every top deck, and Clan War forbids repeats across your 4 decks.",
  ],
  /** Cards that dominate each band right now — used for the "bring an answer" hint. */
  menace: {
    low: ["Mega Knight", "Elite Barbarians", "Witch", "Balloon", "Hog Rider"],
    mid: ["Elite Barbarians", "Mega Knight", "Giant Skeleton", "Minion Giant", "Hero Balloon", "Goblin Barrel"],
    high: ["Hog Rider", "Giant Skeleton", "Battle Ram", "X-Bow", "Royal Hogs", "Boss Bandit"],
    top: ["Mortar", "Cannon Cart", "Goblinstein", "Giant Skeleton", "Mother Witch", "Minion Giant"],
  } satisfies Record<TrophyBand, string[]>,
  decks: [
    // ── Top ladder / challenge S-tier ──
    {
      id: "mortar-cart-goblinstein",
      name: "Evo Mortar Goblinstein Cannon Cart",
      family: "siege",
      tier: "S",
      bands: ["top", "high"],
      cards: ["Evo Mortar", "Goblinstein", "Evo Minion Horde", "Cannon Cart", "Mother Witch", "Fireball", "Goblin Gang", "Barbarian Barrel"],
      source: "RoyaleAPI ranked 7d: 55.7% WR, top-ladder 57.3%",
      note: "Mortar sits at the bridge and the rest of the deck is a defensive wall; Cannon Cart and Mother Witch punish the counter-push.",
    },
    {
      id: "mortar-cart-berserker",
      name: "Evo Mortar Cart · Hero Berserker",
      family: "siege",
      tier: "S",
      bands: ["top", "high", "mid"],
      cards: ["Evo Skeleton Barrel", "Hero Berserker", "Evo Mortar", "Cannon Cart", "Fireball", "Minions", "Rascals", "Barbarian Barrel"],
      source: "RoyaleAPI ranked 7d: 54.5% WR; all-ladder 66.3%",
      note: "Cheaper Mortar shell; Skeleton Barrel and Berserker turn every defense into chip.",
    },
    {
      id: "mortar-cart-minion-giant",
      name: "Evo Mortar Cart · Minion Giant",
      family: "siege",
      tier: "S",
      bands: ["top", "high"],
      cards: ["Evo Mortar", "Hero Ice Wizard", "Evo Minion Horde", "Minion Giant", "Cannon Cart", "Fireball", "Rascals", "Barbarian Barrel"],
      source: "RoyaleAPI GC 7d: 62.6% WR, #1 GC deck",
      note: "Minion Giant flies over the ground defense while Mortar locks the tower — two win conditions the opponent must answer at once.",
    },
    {
      id: "goblinstein-cycle-33",
      name: "Goblinstein 3.3 Cycle",
      family: "cycle",
      tier: "S",
      bands: ["top", "high"],
      cards: ["Evo Archers", "Barbarian Barrel", "Electro Spirit", "Goblinstein", "Lightning", "Minion Giant", "Skeletons", "Evo Tesla"],
      source: "RoyaleAPI GC 7d: 60.0% WR; top-ladder #1 (58.1%)",
      note: "Defend with Tesla + Archers, then Goblinstein's monster tanks for Minion Giant; Lightning resets and finishes.",
    },
    {
      id: "goblinstein-hut-cycle",
      name: "Goblinstein Goblin Hut 3.0 Cycle",
      family: "cycle",
      tier: "S",
      bands: ["top", "high"],
      cards: ["Evo Skeletons", "Hero Ice Wizard", "Goblinstein", "Minion Giant", "Fireball", "Goblin Hut", "Electro Spirit", "Barbarian Barrel"],
      source: "RoyaleAPI GC 7d: 61.4% WR",
      note: "Goblin Hut chips all game; Hero Ice Wizard's snowman freeze buys the Minion Giant its tower hits.",
    },
    {
      id: "giant-skeleton-hero-wizard",
      name: "Giant Skeleton Evo Ram Hero Wizard",
      family: "midrange",
      tier: "S",
      bands: ["top", "high", "mid"],
      cards: ["Evo Battle Ram", "Hero Wizard", "Evo Royal Ghost", "Giant Skeleton", "Mother Witch", "Vines", "Zappies", "Barbarian Barrel"],
      source: "RoyaleAPI ranked 7d: 54.0% WR, most-played UC deck (1.0%)",
      note: "Giant Skeleton in front, Ram behind, Wizard splashing: the current ladder bully. Vines roots the counter-push.",
    },
    {
      id: "giant-skeleton-ebarbs",
      name: "Giant Skeleton Hero Wizard · Evo E-Barbs",
      family: "midrange",
      tier: "A",
      bands: ["high", "mid", "low"],
      cards: ["Evo Battle Ram", "Hero Wizard", "Evo Elite Barbarians", "Giant Skeleton", "Mother Witch", "Vines", "Zappies", "Barbarian Barrel"],
      source: "RoyaleAPI CC 7d: 57.4% WR, 3.5% usage",
      note: "The E-Barbs variant: brute force that punishes any misplay. Best where opponents don't have a P.E.K.K.A ready.",
    },
    {
      id: "pekka-bridge-spam",
      name: "P.E.K.K.A Bridge Spam",
      family: "bridge",
      tier: "S",
      bands: ["top", "high", "mid"],
      cards: ["Evo Battle Ram", "Hero Magic Archer", "Evo Royal Ghost", "P.E.K.K.A", "Fireball", "Electro Wizard", "Bandit", "Zap"],
      source: "RoyaleAPI ranked 7d: 54.3% WR",
      note: "Defend with P.E.K.K.A, then Ram + Bandit + Ghost at the bridge before they recover elixir.",
    },
    {
      id: "hero-knight-log-bait",
      name: "Hero Knight Log Bait 2.9",
      family: "bait",
      tier: "S",
      bands: ["top", "high", "mid"],
      cards: ["Evo Goblin Barrel", "Hero Knight", "Evo Skeleton Army", "Princess", "Dart Goblin", "Ice Spirit", "The Log", "Inferno Tower"],
      source: "RoyaleAPI ranked 7d: 54.0% WR; ladder 11–14k 62.8%",
      note: "Bait the Log with Princess or Skarmy, then Barrel. Inferno handles the tanks that bait usually hates.",
    },
    {
      id: "wall-breakers-log-bait",
      name: "Wall Breakers Log Bait 2.8",
      family: "bait",
      tier: "A",
      bands: ["top", "high"],
      cards: ["Cannon", "Dart Goblin", "Evo Goblin Barrel", "Ice Spirit", "Princess", "Evo Skeleton Army", "Hero Valkyrie", "Wall Breakers"],
      source: "RoyaleAPI top ladder: 54.7% WR; all-ladder 67.0%",
      note: "Two bait win conditions: they can't Log both the Barrel and the Wall Breakers.",
    },
    {
      id: "golem-hero-mini-pekka",
      name: "Golem Hero Mini P.E.K.K.A Night Witch",
      family: "beatdown",
      tier: "A",
      bands: ["top", "high", "mid"],
      cards: ["Evo Elite Barbarians", "Hero Mini P.E.K.K.A", "Evo Zap", "Golem", "Phoenix", "Night Witch", "Bomber", "Arrows"],
      source: "RoyaleAPI CC 7d: 59.9% WR, #1 in Classic Challenge",
      note: "Build one giant push behind Golem in double elixir; E-Barbs and Mini P.E.K.K.A defend until then.",
    },
    {
      id: "balloon-double-dragon",
      name: "Balloon Hero Knight Double Dragon",
      family: "air",
      tier: "A",
      bands: ["top", "high", "mid"],
      cards: ["Evo Baby Dragon", "Hero Knight", "Evo Inferno Dragon", "Balloon", "Bowler", "Tornado", "Freeze", "Barbarian Barrel"],
      source: "RoyaleAPI ranked 7d: 53.1% WR (Freeze nerfed this month)",
      note: "Dragons and Bowler wall the ground; Balloon + Freeze or Tornado forces the tower hit.",
    },
    {
      id: "graveyard-ice-wiz-nado",
      name: "Graveyard Ice Wizard Tornado",
      family: "control",
      tier: "A",
      bands: ["top", "high", "mid"],
      cards: ["Evo Baby Dragon", "Barbarian Barrel", "Graveyard", "Ice Wizard", "Evo Knight", "Poison", "Hero Tombstone", "Tornado"],
      source: "RoyaleAPI: 54.0% top ladder, 68.7% all-ladder (#1 by WR)",
      note: "Out-defend them for two minutes, then Knight + Graveyard + Poison at the tower.",
    },
    {
      id: "hog-26-hero-musketeer",
      name: "Hog 2.6 · Hero Musketeer",
      family: "cycle",
      tier: "S",
      bands: ["high", "top", "mid"],
      cards: ["Evo Cannon", "Fireball", "Hog Rider", "Ice Golem", "Ice Spirit", "Hero Musketeer", "Evo Skeletons", "The Log"],
      source: "RoyaleAPI ladder 8–11k: 65.2% WR; 11–14k: 62.3%",
      note: "The eternal climber. Out-cycle their counter to your Hog; Cannon and Musketeer never leave the bridge.",
    },
    {
      id: "hog-26-mighty-miner",
      name: "Hog Mighty Miner Evo Cannon 2.6",
      family: "cycle",
      tier: "S",
      bands: ["high", "top"],
      cards: ["Barbarian Barrel", "Evo Cannon", "Earthquake", "Electro Spirit", "Evo Firecracker", "Hog Rider", "Mighty Miner", "Skeletons"],
      source: "RoyaleAPI ladder 11–14k: 65.8% WR (#1 by WR)",
      note: "Earthquake kills buildings under the Hog; Mighty Miner is the tank-killer and the second win condition.",
    },
    {
      id: "hog-26-minion-giant",
      name: "Hog 2.6 · Minion Giant",
      family: "cycle",
      tier: "A",
      bands: ["top", "high"],
      cards: ["Evo Cannon", "Fireball", "Ice Golem", "Ice Spirit", "Minion Giant", "Hero Musketeer", "Evo Skeletons", "The Log"],
      source: "RoyaleAPI GC 7d: 60.4% WR",
      note: "2.6 shell with Minion Giant instead of Hog — the flying wincon dodges the buildings that stop Hog.",
    },
    {
      id: "royal-giant-fisherman-hunter",
      name: "Evo Royal Giant Fisherman Hunter 3.0",
      family: "midrange",
      tier: "A",
      bands: ["high", "top", "mid"],
      cards: ["Hero Barbarian Barrel", "Electro Spirit", "Fireball", "Fisherman", "Hunter", "Evo Royal Ghost", "Evo Royal Giant", "Skeletons"],
      source: "RoyaleAPI ladder 11–14k: 56.2% WR",
      note: "Fisherman pulls, Hunter kills, Royal Giant taps the tower every time they overcommit.",
    },
    {
      id: "royal-hogs-archer-queen-hut",
      name: "Evo Royal Hogs Archer Queen Goblin Hut",
      family: "hogs",
      tier: "A",
      bands: ["top", "high", "mid"],
      cards: ["Archer Queen", "Barbarian Barrel", "Electro Spirit", "Fireball", "Goblin Hut", "Evo Royal Ghost", "Evo Royal Hogs", "Skeletons"],
      source: "RoyaleAPI GC 7d: 57.3% WR",
      note: "Split-lane pressure with Hogs and Hut; Archer Queen defends anything for 5 elixir.",
    },
    {
      id: "xbow-hero-knight",
      name: "X-Bow Hero Knight 3.0",
      family: "siege",
      tier: "B",
      bands: ["high", "top", "mid"],
      cards: ["Evo Archers", "Electro Spirit", "Fireball", "Hero Knight", "Skeletons", "Evo Tesla", "The Log", "X-Bow"],
      source: "RoyaleAPI ladder 8–14k: most-played, but only 43–46% WR",
      note: "Popular but losing this season — take it only if X-Bow is your highest-level card and you already play siege.",
    },
    {
      id: "golden-knight-ram-ewiz",
      name: "Golden Knight Evo Ram E-Wiz Mother Witch",
      family: "bridge",
      tier: "A",
      bands: ["high", "mid", "top"],
      cards: ["Evo Battle Ram", "Electro Wizard", "Evo Elite Barbarians", "Freeze", "Goblin Demolisher", "Golden Knight", "Mother Witch", "Zap"],
      source: "RoyaleAPI CC 7d: 56.7% WR",
      note: "Golden Knight dash + Ram at the bridge; Freeze seals the tower when they stack a defense.",
    },
    {
      id: "rune-giant-double-dragon",
      name: "Rune Giant Double Dragon Freeze",
      family: "beatdown",
      tier: "A",
      bands: ["high", "mid"],
      cards: ["Arrows", "Evo Elite Barbarians", "Freeze", "Goblin Demolisher", "Evo Inferno Dragon", "Rune Giant", "Skeleton Dragons", "Hero Tombstone"],
      source: "RoyaleAPI CC 7d: 55.2% WR",
      note: "Rune Giant buffs the dragons behind it; Freeze on the tower's defenders wins the trade.",
    },
    {
      id: "royal-hogs-skeleton-barrel",
      name: "Royal Hogs Skeleton Barrel Poison",
      family: "hogs",
      tier: "B",
      bands: ["mid", "high"],
      cards: ["Baby Dragon", "Skeleton Barrel", "Royal Hogs", "Firecracker", "Suspicious Bush", "Berserker", "Fireball", "Poison"],
      source: "clashest.com sample (small), Sept 2026",
      note: "Double spell chip with Hogs + Skeleton Barrel pressure. Thin data — a fallback pick.",
    },

    // ── Classics: no evo/hero needed — the F2P and low/mid-ladder backbone ──
    {
      id: "hog-26-classic",
      name: "Classic Hog 2.6",
      family: "cycle",
      tier: "A",
      bands: ["low", "mid", "high", "top"],
      cards: ["Hog Rider", "Musketeer", "Ice Golem", "Cannon", "Skeletons", "Ice Spirit", "The Log", "Fireball"],
      source: "Deckshop new-meta Aug 2026; TrophyCoach F2P war lineup",
      note: "Every card cheap to level; the deck that teaches Clash Royale. Defend cheap, Hog at the bridge, repeat.",
    },
    {
      id: "golem-night-witch-classic",
      name: "Golem Night Witch Beatdown",
      family: "beatdown",
      tier: "A",
      bands: ["low", "mid", "high"],
      cards: ["Golem", "Night Witch", "Baby Dragon", "Mega Minion", "Tornado", "Lightning", "Zap", "Lumberjack"],
      source: "TrophyCoach best war decks by archetype, 29 Aug 2026",
      note: "Golem at the back in double elixir, Night Witch and Lumberjack behind it, Lightning the Inferno.",
    },
    {
      id: "log-bait-classic",
      name: "Classic Log Bait",
      family: "bait",
      tier: "A",
      bands: ["low", "mid", "high"],
      cards: ["Goblin Barrel", "Princess", "Goblin Gang", "Knight", "Inferno Tower", "Rocket", "Bats", "Barbarian Barrel"],
      source: "TrophyCoach best war decks by archetype, 29 Aug 2026",
      note: "Rocket cycle in overtime if the Barrel gets answered; Inferno Tower stops the tanks.",
    },
    {
      id: "lavaloon-classic",
      name: "LavaLoon",
      family: "air",
      tier: "A",
      bands: ["low", "mid", "high"],
      cards: ["Lava Hound", "Balloon", "Skeleton Dragons", "Tombstone", "Arrows", "Guards", "Earthquake", "Minions"],
      source: "TrophyCoach best war decks by archetype, 29 Aug 2026",
      note: "Hound first, Balloon behind it when their air defense is gone; Earthquake the building.",
    },
    {
      id: "miner-poison-control",
      name: "Miner Poison Control",
      family: "control",
      tier: "A",
      bands: ["mid", "high", "top"],
      cards: ["Miner", "Poison", "Valkyrie", "Musketeer", "Goblin Cage", "Skeletons", "Ice Spirit", "The Log"],
      source: "Long-running ladder staple; regained room after the August Spirit nerf",
      note: "Never overcommit: Miner + Poison chips while Valkyrie and Goblin Cage hold the other lane.",
    },
    {
      id: "mega-knight-wall-breakers",
      name: "Mega Knight Wall Breakers Bait",
      family: "bait",
      tier: "B",
      bands: ["low", "mid"],
      cards: ["Mega Knight", "Wall Breakers", "Goblin Barrel", "Skeleton Army", "Electro Wizard", "Bats", "Inferno Dragon", "Zap"],
      source: "Mid-ladder staple (Mega Knight 60.6% WR at 5–7k, TrophyCoach Aug 2026)",
      note: "Mega Knight is the whole defense; Wall Breakers and Barrel punish every Mega Knight answer.",
    },
    {
      id: "royal-giant-lightning-classic",
      name: "Royal Giant Lightning",
      family: "midrange",
      tier: "B",
      bands: ["low", "mid"],
      cards: ["Royal Giant", "Lightning", "Fisherman", "Hunter", "Electro Wizard", "Skeletons", "The Log", "Goblin Cage"],
      source: "Ladder staple; lower-band version of the RG Fisherman Hunter shell",
      note: "Lightning resets the Inferno and clears Musketeers; Fisherman drags the counter into the Hunter.",
    },
    {
      id: "giant-graveyard",
      name: "Giant Graveyard",
      family: "control",
      tier: "B",
      bands: ["low", "mid", "high"],
      cards: ["Giant", "Graveyard", "Baby Dragon", "Mega Minion", "Poison", "Zap", "Knight", "Tornado"],
      source: "Ladder staple across bands (Deckshop Aug 2026)",
      note: "Giant tanks for the Graveyard; Poison on the skeletons' counter, Tornado to pull.",
    },
    {
      id: "ebarbs-rage-mid-ladder",
      name: "Evo E-Barbs Rage",
      family: "bridge",
      tier: "B",
      bands: ["low", "mid"],
      cards: ["Evo Elite Barbarians", "Rage", "Mega Knight", "Wizard", "Minions", "Zap", "Fireball", "Skeleton Army"],
      source: "66% WR at 5–6k (TrophyCoach Aug 2026); nerfed Sept 2026",
      note: "Mid-ladder menace deck: Rage + E-Barbs at the bridge whenever the opponent spends elixir. Ugly and effective below 7k.",
    },
    {
      id: "splashyard",
      name: "Splashyard",
      family: "control",
      tier: "B",
      bands: ["mid", "high"],
      cards: ["Graveyard", "Bowler", "Baby Dragon", "Ice Wizard", "Tornado", "Poison", "Barbarian Barrel", "Tombstone"],
      source: "Classic control archetype (repo eval hole #16)",
      note: "Bowler + Tornado + Ice Wizard turn every push into splash damage; Graveyard finishes.",
    },
    {
      id: "three-musketeers-pump",
      name: "Three Musketeers Pump",
      family: "hogs",
      tier: "B",
      bands: ["mid", "high"],
      cards: ["Three Musketeers", "Elixir Collector", "Royal Hogs", "Ice Golem", "Heal Spirit", "Zap", "Goblin Gang", "Battle Ram"],
      source: "Classic split-lane archetype (repo eval hole #14)",
      note: "Pump early, split the Musketeers, and run Hogs + Ram down the weak lane.",
    },
  ] satisfies MetaDeck[],
};

export const META_DECKS: MetaDeck[] = META_SNAPSHOT.decks;
