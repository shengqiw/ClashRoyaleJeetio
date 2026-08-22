/**
 * Shapes returned by the Supercell clan endpoint (`/clans/{tag}`), as served by
 * src/lib/clash.ts. Only fields this app reads are typed — Supercell returns more.
 *
 * If you need a field that isn't here, add it here first; that is what makes the
 * compiler catch the mistake instead of a blank cell in the UI.
 */

export type ClanRole = "leader" | "coLeader" | "elder" | "member";

export type Member = {
    tag: string;
    name: string;
    role: ClanRole;
    /** Supercell timestamp, e.g. "20260821T163000.000Z" — see parseClashDate in src/lib/insights.ts */
    lastSeen: string;
    expLevel: number;
    trophies: number;
    arena: {
        id: number;
        name: string;
    };
    clanRank: number;
    previousClanRank: number;
    donations: number;
    donationsReceived: number;
    clanChestPoints: number;
};

export type MemberList = Member[];

export type Clan = {
    tag: string;
    name: string;
    type: 'open' | 'inviteOnly' | 'closed';
    description: string;
    badgeId: number;
    clanScore: number;
    clanWarTrophies: number;
    location: {
        id: number;
        name: string;
        isCountry: boolean;
        countryCode: string;
    };
    requiredTrophies: number;
    donationsPerWeek: number;
    clanChestStatus: 'inactive' | 'active';
    clanChestLevel: number;
    clanChestMaxLevel: number;
    members: number;
    memberList: MemberList;
}
