/**
 * Shapes returned by the Supercell player endpoint (`/players/{tag}`), as served
 * by src/lib/clash.ts and GET /api/player.
 *
 * The real payload is large (150+ badges, 120+ cards). Only what the app reads is
 * typed; `cards` and `currentDeck` are typed because deck features will want them.
 *
 * COST NOTE: player fetches are ONE PER USER ACTION, never looped over members.
 * See rule 2 in CLAUDE.md — a loop here is the N+1 pattern that killed the old page.
 */

import type { ClanRole } from "./Clan";

export type Card = {
    name: string;
    id: number;
    level: number;
    maxLevel: number;
    maxEvolutionLevel?: number;
    evolutionLevel?: number;
    count?: number;
    elixirCost?: number;
    rarity?: string;
    iconUrls?: { medium?: string; evolutionMedium?: string };
};

export type Player = {
    tag: string;
    name: string;
    expLevel: number;
    trophies: number;
    bestTrophies: number;
    wins: number;
    losses: number;
    battleCount: number;
    threeCrownWins: number;
    currentWinLoseStreak: number;
    role?: ClanRole;
    donations: number;
    donationsReceived: number;
    totalDonations: number;
    warDayWins: number;
    clanCardsCollected: number;
    clan?: {
        tag: string;
        name: string;
        badgeId: number;
    };
    arena: {
        id: number;
        name: string;
    };
    cards: Card[];
    currentDeck: Card[];
    currentFavouriteCard?: Card;
    starPoints?: number;
    expPoints?: number;
};
