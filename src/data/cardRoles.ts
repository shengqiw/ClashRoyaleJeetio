/**
 * Card roles, elixir and substitution hints for the War Decks engine.
 *
 * Why this exists: Clan War needs 4 decks with 32 DIFFERENT cards, built from
 * whatever the player owns at whatever level. Meta templates (metaDecks.ts) are
 * written for max-level accounts with every card, so the engine has to swap
 * cards the player lacks, has underleveled, or has already spent in another war
 * deck — and a swap is only good if it fills the same job in the deck. That job
 * is the `roles` list here. `subs` are the swaps a human would actually make,
 * in preference order; when they run out the engine falls back to any owned
 * card sharing the primary role.
 *
 * Elixir here is only the fallback — the player's card data from the Supercell
 * API carries `elixirCost`, which wins when present. Numbers for cards released
 * after mid-2025 are best-effort; the API corrects them at runtime.
 *
 * Roles (a card may hold several; the first is primary):
 *   wincon      the card the deck wins with
 *   tank        big shield (Golem, Giant, Lava Hound …)
 *   minitank    cheap shield / defensive body (Knight, Ice Golem, Valkyrie …)
 *   antitank    high single-target dps (Mini P.E.K.K.A, Inferno, Hunter …)
 *   ranged      ranged support / air-targeting dps (Musketeer, Archers …)
 *   air         flying troop
 *   splash      area damage
 *   swarm       cheap multi-unit distraction
 *   cycle       1–2 elixir cycle card
 *   building    defensive building or spawner
 *   smallspell  Log / Zap class
 *   bigspell    Fireball / Poison / Rocket class
 *   utility     Tornado, Freeze, Rage, Clone, Mirror …
 *
 * Names match the Supercell catalog (compared via normalizeCardName, so case,
 * punctuation and "The " don't matter).
 */

export type CardRole =
  | "wincon"
  | "tank"
  | "minitank"
  | "antitank"
  | "ranged"
  | "air"
  | "splash"
  | "swarm"
  | "cycle"
  | "building"
  | "smallspell"
  | "bigspell"
  | "utility";

export type CardInfo = {
  elixir: number;
  roles: CardRole[];
  /** Preferred replacements, best first. */
  subs?: string[];
};

const SMALL_SPELLS = ["The Log", "Barbarian Barrel", "Zap", "Giant Snowball", "Arrows", "Royal Delivery", "Vines"];
const BIG_SPELLS = ["Fireball", "Poison", "Lightning", "Rocket", "Earthquake", "Void"];
const CYCLE = ["Skeletons", "Ice Spirit", "Electro Spirit", "Heal Spirit", "Fire Spirit", "Bats", "Spear Goblins", "Goblins"];
const RANGED = ["Musketeer", "Archers", "Hunter", "Electro Wizard", "Magic Archer", "Firecracker", "Dart Goblin", "Flying Machine", "Ice Wizard", "Zappies", "Cannon Cart"];
const MINITANK = ["Knight", "Valkyrie", "Ice Golem", "Royal Ghost", "Golden Knight", "Fisherman", "Bandit", "Mini P.E.K.K.A", "Berserker", "Ronin", "Guards", "Dark Prince", "Lumberjack"];
const BUILDINGS = ["Cannon", "Tesla", "Goblin Cage", "Bomb Tower", "Inferno Tower", "Tombstone", "Goblin Hut", "Furnace"];
const AIR_DEF = ["Minions", "Mega Minion", "Bats", "Musketeer", "Archers", "Electro Wizard", "Hunter", "Phoenix", "Inferno Dragon", "Skeleton Dragons", "Firecracker", "Flying Machine", "Minion Horde"];

export const CARD_ROLES: Record<string, CardInfo> = {
  // ── Win conditions ──
  "Hog Rider": { elixir: 4, roles: ["wincon"], subs: ["Royal Hogs", "Ram Rider", "Battle Ram", "Royal Giant", "Miner", "Mighty Miner"] },
  "Royal Giant": { elixir: 6, roles: ["wincon", "tank"], subs: ["Giant", "Hog Rider", "Royal Hogs", "Goblin Giant", "Elixir Golem"] },
  "Giant": { elixir: 5, roles: ["wincon", "tank"], subs: ["Royal Giant", "Golem", "Goblin Giant", "Electro Giant", "Giant Skeleton"] },
  "Golem": { elixir: 8, roles: ["wincon", "tank"], subs: ["Giant", "Electro Giant", "Lava Hound", "Royal Giant", "Elixir Golem"] },
  "Lava Hound": { elixir: 7, roles: ["wincon", "tank", "air"], subs: ["Balloon", "Golem", "Electro Giant"] },
  "Balloon": { elixir: 5, roles: ["wincon", "air"], subs: ["Lava Hound", "Skeleton Barrel", "Minion Giant", "Hog Rider"] },
  "X-Bow": { elixir: 6, roles: ["wincon", "building"], subs: ["Mortar", "Hog Rider", "Royal Giant"] },
  "Mortar": { elixir: 4, roles: ["wincon", "building"], subs: ["X-Bow", "Hog Rider", "Royal Giant", "Goblin Drill"] },
  "Graveyard": { elixir: 5, roles: ["wincon"], subs: ["Miner", "Goblin Drill", "Goblin Barrel", "Hog Rider"] },
  "Miner": { elixir: 3, roles: ["wincon", "minitank"], subs: ["Mighty Miner", "Goblin Drill", "Wall Breakers", "Hog Rider"] },
  "Mighty Miner": { elixir: 4, roles: ["wincon", "minitank", "antitank"], subs: ["Miner", "Goblin Drill", "Hog Rider"] },
  "Goblin Barrel": { elixir: 3, roles: ["wincon"], subs: ["Goblin Drill", "Miner", "Wall Breakers", "Skeleton Barrel", "Graveyard"] },
  "Goblin Drill": { elixir: 4, roles: ["wincon", "building"], subs: ["Goblin Barrel", "Miner", "Mortar", "Hog Rider"] },
  "Wall Breakers": { elixir: 2, roles: ["wincon", "cycle"], subs: ["Goblin Barrel", "Skeleton Barrel", "Miner", "Battle Ram"] },
  "Royal Hogs": { elixir: 5, roles: ["wincon"], subs: ["Hog Rider", "Ram Rider", "Battle Ram", "Royal Giant"] },
  "Ram Rider": { elixir: 5, roles: ["wincon"], subs: ["Hog Rider", "Battle Ram", "Royal Hogs", "Prince"] },
  "Battle Ram": { elixir: 4, roles: ["wincon"], subs: ["Ram Rider", "Hog Rider", "Royal Hogs", "Wall Breakers", "Prince"] },
  "Elixir Golem": { elixir: 3, roles: ["wincon", "tank"], subs: ["Golem", "Giant", "Royal Giant"] },
  "Electro Giant": { elixir: 7, roles: ["wincon", "tank"], subs: ["Golem", "Giant", "Royal Giant", "Rune Giant"] },
  "Goblin Giant": { elixir: 6, roles: ["wincon", "tank"], subs: ["Giant", "Royal Giant", "Golem"] },
  "Giant Skeleton": { elixir: 6, roles: ["wincon", "tank", "splash"], subs: ["P.E.K.K.A", "Giant", "Mega Knight", "Golem"] },
  "P.E.K.K.A": { elixir: 7, roles: ["wincon", "antitank", "tank"], subs: ["Mega Knight", "Giant Skeleton", "Prince", "Mini P.E.K.K.A"] },
  "Mega Knight": { elixir: 7, roles: ["wincon", "tank", "splash"], subs: ["P.E.K.K.A", "Giant Skeleton", "Valkyrie"] },
  "Sparky": { elixir: 6, roles: ["wincon", "splash"], subs: ["Rune Giant", "Goblin Machine", "P.E.K.K.A"] },
  "Skeleton Barrel": { elixir: 3, roles: ["wincon", "air", "swarm"], subs: ["Goblin Barrel", "Wall Breakers", "Balloon", "Minion Giant"] },
  "Three Musketeers": { elixir: 9, roles: ["wincon", "ranged"], subs: ["Musketeer", "Royal Hogs", "Royal Recruits"] },
  "Royal Recruits": { elixir: 7, roles: ["wincon", "minitank"], subs: ["Royal Hogs", "Barbarians", "Three Musketeers"] },
  "Elite Barbarians": { elixir: 6, roles: ["wincon", "antitank"], subs: ["Barbarians", "Prince", "Battle Ram", "Royal Recruits"] },
  "Prince": { elixir: 5, roles: ["wincon", "antitank"], subs: ["Dark Prince", "Ram Rider", "Mini P.E.K.K.A", "Battle Ram"] },
  "Rune Giant": { elixir: 4, roles: ["wincon", "tank"], subs: ["Electro Giant", "Giant", "Royal Giant", "Sparky"] },
  "Goblin Machine": { elixir: 5, roles: ["wincon", "antitank"], subs: ["Sparky", "P.E.K.K.A", "Prince"] },
  "Goblinstein": { elixir: 5, roles: ["wincon", "tank"], subs: ["Giant", "Goblin Giant", "Royal Giant"] },
  "Boss Bandit": { elixir: 6, roles: ["wincon", "minitank"], subs: ["Bandit", "Golden Knight", "Prince"] },
  "Minion Giant": { elixir: 4, roles: ["wincon", "air"], subs: ["Balloon", "Skeleton Barrel", "Lava Hound", "Mega Minion"] },
  "Spirit Empress": { elixir: 6, roles: ["wincon", "splash"], subs: ["Witch", "Wizard", "Sparky"] },
  "Lumberjack": { elixir: 4, roles: ["minitank", "antitank", "utility"], subs: MINITANK },
  "Skeleton King": { elixir: 4, roles: ["minitank", "antitank"], subs: ["Golden Knight", "Knight", "Valkyrie", "Mini P.E.K.K.A"] },
  "Golden Knight": { elixir: 4, roles: ["minitank", "antitank"], subs: ["Skeleton King", "Bandit", "Knight", "Royal Ghost", "Boss Bandit"] },
  "Archer Queen": { elixir: 5, roles: ["ranged", "antitank"], subs: ["Musketeer", "Magic Archer", "Hunter", "Electro Wizard"] },
  "Monk": { elixir: 5, roles: ["minitank", "antitank"], subs: ["Knight", "Golden Knight", "Valkyrie", "Fisherman"] },
  "Little Prince": { elixir: 3, roles: ["ranged", "minitank"], subs: ["Archers", "Musketeer", "Dart Goblin", "Firecracker"] },

  // ── Tanks / mini tanks / anti-tank ──
  "Knight": { elixir: 3, roles: ["minitank"], subs: ["Valkyrie", "Ice Golem", "Royal Ghost", "Golden Knight", "Mini P.E.K.K.A", "Bandit", "Fisherman", "Berserker", "Ronin", "Guards"] },
  "Valkyrie": { elixir: 4, roles: ["minitank", "splash"], subs: ["Knight", "Dark Prince", "Mini P.E.K.K.A", "Mega Knight", "Golden Knight", "Bowler"] },
  "Ice Golem": { elixir: 2, roles: ["minitank", "cycle"], subs: ["Knight", "Skeletons", "Ice Spirit", "Guards", "Royal Ghost"] },
  "Mini P.E.K.K.A": { elixir: 4, roles: ["antitank", "minitank"], subs: ["Lumberjack", "Prince", "Hunter", "Skeleton King", "Golden Knight", "Mighty Miner", "Knight"] },
  "Bandit": { elixir: 3, roles: ["minitank", "wincon"], subs: ["Royal Ghost", "Golden Knight", "Knight", "Boss Bandit", "Dark Prince"] },
  "Royal Ghost": { elixir: 3, roles: ["minitank", "splash"], subs: ["Bandit", "Knight", "Ice Golem", "Golden Knight", "Dark Prince"] },
  "Dark Prince": { elixir: 4, roles: ["minitank", "splash"], subs: ["Valkyrie", "Prince", "Royal Ghost", "Knight"] },
  "Fisherman": { elixir: 3, roles: ["minitank", "utility"], subs: ["Knight", "Ice Golem", "Tornado", "Royal Ghost"] },
  "Guards": { elixir: 3, roles: ["swarm", "minitank"], subs: ["Skeleton Army", "Goblin Gang", "Knight", "Skeletons"] },
  "Barbarians": { elixir: 5, roles: ["minitank", "swarm"], subs: ["Elite Barbarians", "Royal Recruits", "Valkyrie", "Rascals"] },
  "Rascals": { elixir: 5, roles: ["minitank", "ranged"], subs: ["Barbarians", "Knight", "Goblin Gang", "Royal Recruits"] },
  "Battle Healer": { elixir: 4, roles: ["minitank", "utility"], subs: ["Knight", "Valkyrie", "Heal Spirit"] },
  "Berserker": { elixir: 4, roles: ["minitank", "antitank"], subs: ["Knight", "Mini P.E.K.K.A", "Lumberjack", "Valkyrie"] },
  "Ronin": { elixir: 5, roles: ["minitank", "antitank"], subs: ["Knight", "Golden Knight", "Mini P.E.K.K.A", "Valkyrie"] },
  "Hunter": { elixir: 4, roles: ["antitank", "ranged"], subs: ["Musketeer", "Mini P.E.K.K.A", "Inferno Dragon", "Electro Wizard", "Archers"] },
  "Inferno Dragon": { elixir: 4, roles: ["antitank", "air"], subs: ["Inferno Tower", "Hunter", "Mini P.E.K.K.A", "Mega Minion", "Phoenix"] },
  "Inferno Tower": { elixir: 5, roles: ["building", "antitank"], subs: ["Inferno Dragon", "Tesla", "Cannon", "Bomb Tower", "Goblin Cage"] },

  // ── Ranged / air-targeting support ──
  "Musketeer": { elixir: 4, roles: ["ranged"], subs: ["Archers", "Hunter", "Electro Wizard", "Magic Archer", "Firecracker", "Dart Goblin", "Flying Machine", "Archer Queen"] },
  "Archers": { elixir: 3, roles: ["ranged"], subs: ["Musketeer", "Dart Goblin", "Firecracker", "Spear Goblins", "Little Prince", "Magic Archer"] },
  "Dart Goblin": { elixir: 3, roles: ["ranged", "cycle"], subs: ["Archers", "Firecracker", "Spear Goblins", "Princess", "Musketeer"] },
  "Firecracker": { elixir: 3, roles: ["ranged", "splash"], subs: ["Archers", "Dart Goblin", "Musketeer", "Princess", "Magic Archer"] },
  "Magic Archer": { elixir: 4, roles: ["ranged", "splash"], subs: ["Musketeer", "Firecracker", "Electro Wizard", "Princess", "Archers"] },
  "Electro Wizard": { elixir: 4, roles: ["ranged", "utility"], subs: ["Musketeer", "Magic Archer", "Hunter", "Zappies", "Ice Wizard"] },
  "Ice Wizard": { elixir: 3, roles: ["ranged", "splash", "utility"], subs: ["Electro Wizard", "Musketeer", "Archers", "Baby Dragon"] },
  "Wizard": { elixir: 5, roles: ["splash", "ranged"], subs: ["Baby Dragon", "Executioner", "Witch", "Ice Wizard", "Firecracker"] },
  "Witch": { elixir: 5, roles: ["splash", "ranged"], subs: ["Wizard", "Night Witch", "Mother Witch", "Baby Dragon"] },
  "Night Witch": { elixir: 4, roles: ["splash", "swarm"], subs: ["Witch", "Baby Dragon", "Mother Witch", "Dark Prince"] },
  "Mother Witch": { elixir: 4, roles: ["ranged", "splash"], subs: ["Witch", "Wizard", "Baby Dragon", "Magic Archer"] },
  "Princess": { elixir: 3, roles: ["ranged", "splash"], subs: ["Dart Goblin", "Firecracker", "Archers", "Magic Archer"] },
  "Flying Machine": { elixir: 4, roles: ["ranged", "air"], subs: ["Musketeer", "Archers", "Mega Minion", "Minions"] },
  "Zappies": { elixir: 4, roles: ["ranged", "utility"], subs: ["Electro Wizard", "Musketeer", "Archers", "Hunter"] },
  "Cannon Cart": { elixir: 5, roles: ["ranged", "building"], subs: ["Musketeer", "Hunter", "Zappies", "Cannon"] },
  "Executioner": { elixir: 5, roles: ["splash", "ranged"], subs: ["Bowler", "Wizard", "Baby Dragon", "Witch"] },
  "Bowler": { elixir: 5, roles: ["splash", "minitank"], subs: ["Executioner", "Valkyrie", "Baby Dragon", "Dark Prince"] },
  "Bomber": { elixir: 2, roles: ["splash", "cycle"], subs: ["Firecracker", "Baby Dragon", "Wizard", "Ice Wizard"] },
  "Goblin Demolisher": { elixir: 4, roles: ["splash", "ranged"], subs: ["Wizard", "Firecracker", "Baby Dragon", "Bomber", "Executioner"] },
  "Spear Goblins": { elixir: 2, roles: ["cycle", "ranged", "swarm"], subs: ["Dart Goblin", "Archers", "Bats", "Goblins", "Skeletons"] },

  // ── Air ──
  "Minions": { elixir: 3, roles: ["air", "swarm"], subs: ["Mega Minion", "Bats", "Minion Horde", "Skeleton Dragons", "Flying Machine"] },
  "Minion Horde": { elixir: 5, roles: ["air", "swarm"], subs: ["Minions", "Bats", "Mega Minion", "Skeleton Dragons"] },
  "Mega Minion": { elixir: 3, roles: ["air", "antitank"], subs: ["Minions", "Inferno Dragon", "Skeleton Dragons", "Phoenix", "Flying Machine"] },
  "Bats": { elixir: 2, roles: ["air", "swarm", "cycle"], subs: ["Minions", "Skeletons", "Spear Goblins", "Mega Minion"] },
  "Baby Dragon": { elixir: 4, roles: ["air", "splash"], subs: ["Skeleton Dragons", "Electro Dragon", "Wizard", "Executioner", "Phoenix"] },
  "Skeleton Dragons": { elixir: 4, roles: ["air", "splash"], subs: ["Baby Dragon", "Minions", "Electro Dragon", "Mega Minion"] },
  "Electro Dragon": { elixir: 5, roles: ["air", "splash", "utility"], subs: ["Baby Dragon", "Skeleton Dragons", "Electro Wizard", "Zappies"] },
  "Phoenix": { elixir: 4, roles: ["air", "antitank"], subs: ["Inferno Dragon", "Mega Minion", "Baby Dragon", "Minions"] },

  // ── Swarm / cycle ──
  "Skeletons": { elixir: 1, roles: ["cycle", "swarm"], subs: ["Ice Spirit", "Electro Spirit", "Bats", "Spear Goblins", "Goblins", "Heal Spirit", "Fire Spirit", "Guards"] },
  "Ice Spirit": { elixir: 1, roles: ["cycle", "utility"], subs: ["Electro Spirit", "Skeletons", "Heal Spirit", "Fire Spirit", "Bats", "Ice Golem"] },
  "Electro Spirit": { elixir: 1, roles: ["cycle", "utility"], subs: ["Ice Spirit", "Skeletons", "Heal Spirit", "Fire Spirit", "Bats"] },
  "Fire Spirit": { elixir: 1, roles: ["cycle", "splash"], subs: ["Ice Spirit", "Electro Spirit", "Skeletons", "Heal Spirit", "Bomber"] },
  "Heal Spirit": { elixir: 1, roles: ["cycle", "utility"], subs: ["Ice Spirit", "Electro Spirit", "Skeletons", "Fire Spirit"] },
  "Goblins": { elixir: 2, roles: ["swarm", "cycle"], subs: ["Spear Goblins", "Skeletons", "Goblin Gang", "Bats", "Guards"] },
  "Goblin Gang": { elixir: 3, roles: ["swarm"], subs: ["Skeleton Army", "Guards", "Goblins", "Rascals", "Spear Goblins"] },
  "Skeleton Army": { elixir: 3, roles: ["swarm"], subs: ["Goblin Gang", "Guards", "Minion Horde", "Skeletons"] },
  "Suspicious Bush": { elixir: 2, roles: ["swarm", "cycle"], subs: ["Goblins", "Skeletons", "Guards", "Wall Breakers"] },

  // ── Buildings ──
  "Cannon": { elixir: 3, roles: ["building"], subs: ["Tesla", "Goblin Cage", "Bomb Tower", "Inferno Tower", "Tombstone", "Goblin Hut"] },
  "Tesla": { elixir: 4, roles: ["building"], subs: ["Cannon", "Goblin Cage", "Bomb Tower", "Inferno Tower", "Tombstone"] },
  "Goblin Cage": { elixir: 4, roles: ["building", "minitank"], subs: ["Cannon", "Tesla", "Tombstone", "Bomb Tower", "Inferno Tower"] },
  "Bomb Tower": { elixir: 4, roles: ["building", "splash"], subs: ["Tesla", "Cannon", "Goblin Cage", "Inferno Tower"] },
  "Tombstone": { elixir: 3, roles: ["building", "swarm"], subs: ["Goblin Cage", "Cannon", "Tesla", "Goblin Hut"] },
  "Goblin Hut": { elixir: 5, roles: ["building", "swarm"], subs: ["Furnace", "Tombstone", "Barbarian Hut", "Goblin Cage"] },
  "Furnace": { elixir: 4, roles: ["building", "splash"], subs: ["Goblin Hut", "Tombstone", "Bomb Tower"] },
  "Barbarian Hut": { elixir: 6, roles: ["building", "swarm"], subs: ["Goblin Hut", "Furnace", "Tombstone"] },
  "Elixir Collector": { elixir: 6, roles: ["utility", "building"], subs: ["Goblin Hut", "Tombstone"] },

  // ── Spells ──
  "The Log": { elixir: 2, roles: ["smallspell"], subs: ["Barbarian Barrel", "Zap", "Giant Snowball", "Arrows", "Royal Delivery", "Vines"] },
  "Barbarian Barrel": { elixir: 2, roles: ["smallspell"], subs: ["The Log", "Zap", "Giant Snowball", "Arrows", "Royal Delivery", "Vines"] },
  "Zap": { elixir: 2, roles: ["smallspell", "utility"], subs: ["The Log", "Giant Snowball", "Barbarian Barrel", "Arrows", "Electro Spirit"] },
  "Giant Snowball": { elixir: 2, roles: ["smallspell", "utility"], subs: ["Zap", "The Log", "Arrows", "Barbarian Barrel"] },
  "Arrows": { elixir: 3, roles: ["smallspell"], subs: ["The Log", "Zap", "Giant Snowball", "Barbarian Barrel", "Fireball"] },
  "Royal Delivery": { elixir: 3, roles: ["smallspell", "utility"], subs: ["Arrows", "The Log", "Barbarian Barrel", "Zap"] },
  "Vines": { elixir: 3, roles: ["smallspell", "utility"], subs: ["The Log", "Barbarian Barrel", "Arrows", "Zap"] },
  "Fireball": { elixir: 4, roles: ["bigspell"], subs: ["Poison", "Lightning", "Rocket", "Earthquake", "Void", "Arrows"] },
  "Poison": { elixir: 4, roles: ["bigspell"], subs: ["Fireball", "Lightning", "Rocket", "Void", "Earthquake"] },
  "Lightning": { elixir: 6, roles: ["bigspell"], subs: ["Fireball", "Rocket", "Poison", "Earthquake", "Void"] },
  "Rocket": { elixir: 6, roles: ["bigspell"], subs: ["Lightning", "Fireball", "Poison", "Earthquake"] },
  "Earthquake": { elixir: 3, roles: ["bigspell"], subs: ["Fireball", "Poison", "Lightning", "Rocket"] },
  "Void": { elixir: 5, roles: ["bigspell"], subs: ["Fireball", "Poison", "Lightning", "Rocket"] },
  "Goblin Curse": { elixir: 2, roles: ["utility", "bigspell"], subs: ["Poison", "Fireball", "Earthquake"] },
  "Tornado": { elixir: 3, roles: ["utility"], subs: ["Fisherman", "Ice Wizard", "Giant Snowball", "Zap"] },
  "Freeze": { elixir: 4, roles: ["utility"], subs: ["Rage", "Tornado", "Zap", "Giant Snowball"] },
  "Rage": { elixir: 2, roles: ["utility"], subs: ["Freeze", "Zap", "Lumberjack"] },
  "Clone": { elixir: 3, roles: ["utility"], subs: ["Rage", "Freeze"] },
  "Mirror": { elixir: 3, roles: ["utility"], subs: ["Rage", "Clone"] },
};

/** Cards in the same role, deduped and in a stable "most standard first" order. */
export const ROLE_FALLBACKS: Record<CardRole, string[]> = {
  smallspell: SMALL_SPELLS,
  bigspell: BIG_SPELLS,
  cycle: CYCLE,
  ranged: RANGED,
  minitank: MINITANK,
  building: BUILDINGS,
  air: AIR_DEF,
  wincon: ["Hog Rider", "Royal Giant", "Giant", "Miner", "Balloon", "Graveyard", "Goblin Barrel", "Royal Hogs", "Mortar", "X-Bow", "Golem", "Lava Hound", "P.E.K.K.A", "Mega Knight", "Battle Ram", "Ram Rider", "Wall Breakers", "Goblin Drill", "Elixir Golem", "Electro Giant", "Giant Skeleton", "Prince", "Elite Barbarians", "Sparky", "Skeleton Barrel", "Rune Giant", "Goblinstein", "Minion Giant", "Boss Bandit"],
  tank: ["Golem", "Giant", "Royal Giant", "Lava Hound", "Electro Giant", "Goblin Giant", "P.E.K.K.A", "Mega Knight", "Giant Skeleton", "Elixir Golem", "Rune Giant"],
  antitank: ["Mini P.E.K.K.A", "Hunter", "Inferno Dragon", "Inferno Tower", "Lumberjack", "Prince", "Mighty Miner", "Golden Knight", "Skeleton King", "P.E.K.K.A", "Mega Minion", "Phoenix", "Elite Barbarians"],
  splash: ["Baby Dragon", "Valkyrie", "Wizard", "Executioner", "Bowler", "Firecracker", "Bomber", "Witch", "Magic Archer", "Ice Wizard", "Dark Prince", "Skeleton Dragons", "Electro Dragon", "Mother Witch"],
  swarm: ["Skeleton Army", "Goblin Gang", "Guards", "Minions", "Bats", "Skeletons", "Goblins", "Spear Goblins", "Minion Horde", "Rascals", "Barbarians"],
  utility: ["Tornado", "Freeze", "Rage", "Zap", "Giant Snowball", "Fisherman", "Electro Wizard", "Ice Wizard"],
};
