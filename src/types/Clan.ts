export type Clan = {
    tag: string;
    name: string;
    type: 'open' | 'inviteOnly';
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

export type MemberList = {
    tag: string;
    name: string;
    role: 'leader' | 'coLeader' | 'elder' | 'member';
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
}[]