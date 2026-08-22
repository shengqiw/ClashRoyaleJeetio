/**
 * Derived clan analytics. PURE FUNCTIONS ONLY — no fetch, no env, no I/O.
 *
 * WHY THIS EXISTS: rule 2 in CLAUDE.md forbids per-member fetches. Everything
 * interesting about the clan is already sitting in the ONE clan payload; this file
 * is where that payload turns into facts. A new feature that needs "who's slacking"
 * or "who deserves elder" adds a function here and costs zero API calls.
 *
 * Consumers today: /stats (ClanPulse strip), /api/analyze (facts injected into the
 * LLM prompt so the model reports real numbers instead of inventing them),
 * /api/insights (raw JSON, handy for a Claude session poking at the data).
 *
 * TUNING: every threshold is a named constant in THRESHOLDS below. Change the
 * numbers there, not inline — the UI and the AI prompt both read from this file, so
 * one edit moves both and they can never disagree.
 *
 * DETERMINISM: every entry point takes an explicit `now` so output is reproducible.
 */

import type { Clan, ClanRole, Member } from "@/types/Clan";

export const THRESHOLDS = {
  /** Seen within this many days = "active". */
  activeDays: 2,
  /** Seen within this many days = "idle"; beyond it = "inactive". */
  idleDays: 7,
  /**
   * Donations at or above this in the current week reads as pulling weight.
   * CALIBRATED against the live roster (Aug 2026, 40 members): median 10,
   * p75 98, p90 202, max 284. 150 selects roughly the top decile — a real
   * shortlist. Do not raise this past the observed max or every donation-based
   * feature silently returns an empty list.
   */
  strongDonations: 150,
  /** Donations at or below this reads as not pulling weight (median is ~10). */
  weakDonations: 25,
  /** Receiving at least this much while donating <= weakDonations = freeloading. */
  freeloaderReceived: 100,
  /** Clash Royale hard cap on clan size — used for "X slots open". */
  clanCapacity: 50,
} as const;

export type Activity = "active" | "idle" | "inactive";

/** A per-member verdict. Flags are stable string keys, safe to render or branch on. */
export type MemberInsight = {
  tag: string;
  name: string;
  role: ClanRole;
  clanRank: number;
  rankDelta: number;
  trophies: number;
  donations: number;
  donationsReceived: number;
  netDonations: number;
  /** donations / donationsReceived, capped for display. null when they received none. */
  donationRatio: number | null;
  daysSinceSeen: number | null;
  activity: Activity;
  flags: MemberFlag[];
};

export type MemberFlag =
  | "inactive"
  | "idle"
  | "freeloader"
  | "generous"
  | "carry"
  | "promotion-candidate"
  | "at-risk";

export type ClanInsights = {
  clan: { tag: string; name: string; score: number; warTrophies: number };
  generatedAt: string;
  roster: {
    members: number;
    capacity: number;
    openSlots: number;
    roles: Record<ClanRole, number>;
  };
  activity: {
    active: number;
    idle: number;
    inactive: number;
    /** Worst offenders first. */
    inactiveMembers: Array<{ name: string; daysSinceSeen: number | null; role: ClanRole }>;
  };
  donations: {
    total: number;
    mean: number;
    median: number;
    zeroDonors: number;
    top: Array<{ name: string; donations: number }>;
    freeloaders: Array<{ name: string; donations: number; donationsReceived: number }>;
  };
  trophies: {
    total: number;
    median: number;
    top: Array<{ name: string; trophies: number }>;
  };
  /** Heuristic only — see promotionCandidates() for what it can and cannot see. */
  promotionCandidates: Array<{ name: string; role: ClanRole; donations: number; daysSinceSeen: number | null }>;
  atRisk: Array<{ name: string; role: ClanRole; daysSinceSeen: number | null; donations: number }>;
  /** Plain-English one-liners. Rendered in the UI and fed to the LLM verbatim. */
  headlines: string[];
  members: MemberInsight[];
};

/* ------------------------------------------------------------------ helpers */

/** Supercell stamps look like "20260821T163000.000Z". Date can't parse that. */
export function parseClashDate(raw: string | undefined | null): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(raw ?? "");
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days between `raw` and `now`. null when the stamp is missing/garbage. */
export function daysSince(raw: string | undefined | null, now: number): number | null {
  const d = parseClashDate(raw);
  if (!d) return null;
  return Math.max(0, Math.floor((now - d.getTime()) / 86_400_000));
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function classify(daysSinceSeen: number | null): Activity {
  if (daysSinceSeen === null) return "idle";
  if (daysSinceSeen <= THRESHOLDS.activeDays) return "active";
  if (daysSinceSeen <= THRESHOLDS.idleDays) return "idle";
  return "inactive";
}

/* -------------------------------------------------------------- per member */

export function memberInsight(m: Member, now: number): MemberInsight {
  const daysSinceSeen = daysSince(m.lastSeen, now);
  const activity = classify(daysSinceSeen);
  const donations = m.donations ?? 0;
  const donationsReceived = m.donationsReceived ?? 0;
  const donationRatio = donationsReceived > 0 ? Number((donations / donationsReceived).toFixed(2)) : null;

  const flags: MemberFlag[] = [];
  if (activity === "inactive") flags.push("inactive");
  if (activity === "idle") flags.push("idle");
  if (donations >= THRESHOLDS.strongDonations) flags.push("generous");
  if (donations <= THRESHOLDS.weakDonations && donationsReceived >= THRESHOLDS.freeloaderReceived) {
    flags.push("freeloader");
  }
  if (activity === "active" && donations >= THRESHOLDS.strongDonations && m.clanRank <= 10) {
    flags.push("carry");
  }
  if (activity === "inactive" && donations <= THRESHOLDS.weakDonations) flags.push("at-risk");

  return {
    tag: m.tag,
    name: m.name,
    role: m.role,
    clanRank: m.clanRank,
    rankDelta: (m.previousClanRank ?? m.clanRank) - m.clanRank,
    trophies: m.trophies,
    donations,
    donationsReceived,
    netDonations: donations - donationsReceived,
    donationRatio,
    daysSinceSeen,
    activity,
    flags,
  };
}

/**
 * Members who look ready for elder, from clan-payload data ALONE.
 *
 * HONEST LIMITATION: the real bar on /promotions is war medals over 4 weeks plus a
 * co-leader recommendation. The clan endpoint returns neither — it has no war medal
 * field and no join date. So this is a proxy: currently-active members who donate
 * hard. Treat it as a shortlist for a human to check, never as the decision.
 */
export function promotionCandidates(insights: MemberInsight[]) {
  return insights
    .filter(
      (m) =>
        m.role === "member" &&
        m.activity === "active" &&
        m.donations >= THRESHOLDS.strongDonations,
    )
    .sort((a, b) => b.donations - a.donations)
    .map((m) => ({ name: m.name, role: m.role, donations: m.donations, daysSinceSeen: m.daysSinceSeen }));
}

/* ---------------------------------------------------------------- per clan */

export function analyzeClan(clan: Clan, now: number = Date.now()): ClanInsights {
  const roster = clan.memberList ?? [];
  const members = roster.map((m) => memberInsight(m, now));

  const roles: Record<ClanRole, number> = { leader: 0, coLeader: 0, elder: 0, member: 0 };
  for (const m of members) if (m.role in roles) roles[m.role] += 1;

  const donationsList = members.map((m) => m.donations);
  const trophyList = members.map((m) => m.trophies);
  const totalDonations = donationsList.reduce((a, b) => a + b, 0);

  const byActivity = (a: Activity) => members.filter((m) => m.activity === a);
  const inactive = byActivity("inactive");

  const insights: ClanInsights = {
    clan: {
      tag: clan.tag,
      name: clan.name,
      score: clan.clanScore,
      warTrophies: clan.clanWarTrophies,
    },
    generatedAt: new Date(now).toISOString(),
    roster: {
      members: members.length,
      capacity: THRESHOLDS.clanCapacity,
      openSlots: Math.max(0, THRESHOLDS.clanCapacity - members.length),
      roles,
    },
    activity: {
      active: byActivity("active").length,
      idle: byActivity("idle").length,
      inactive: inactive.length,
      inactiveMembers: [...inactive]
        .sort((a, b) => (b.daysSinceSeen ?? 0) - (a.daysSinceSeen ?? 0))
        .map((m) => ({ name: m.name, daysSinceSeen: m.daysSinceSeen, role: m.role })),
    },
    donations: {
      total: totalDonations,
      mean: members.length ? Math.round(totalDonations / members.length) : 0,
      median: median(donationsList),
      zeroDonors: members.filter((m) => m.donations === 0).length,
      top: [...members]
        .sort((a, b) => b.donations - a.donations)
        .slice(0, 5)
        .map((m) => ({ name: m.name, donations: m.donations })),
      freeloaders: members
        .filter((m) => m.flags.includes("freeloader"))
        .sort((a, b) => a.netDonations - b.netDonations)
        .map((m) => ({ name: m.name, donations: m.donations, donationsReceived: m.donationsReceived })),
    },
    trophies: {
      total: trophyList.reduce((a, b) => a + b, 0),
      median: median(trophyList),
      top: [...members]
        .sort((a, b) => b.trophies - a.trophies)
        .slice(0, 5)
        .map((m) => ({ name: m.name, trophies: m.trophies })),
    },
    promotionCandidates: promotionCandidates(members),
    atRisk: members
      .filter((m) => m.flags.includes("at-risk"))
      .sort((a, b) => (b.daysSinceSeen ?? 0) - (a.daysSinceSeen ?? 0))
      .map((m) => ({ name: m.name, role: m.role, daysSinceSeen: m.daysSinceSeen, donations: m.donations })),
    headlines: [],
    members,
  };

  insights.headlines = headlines(insights);
  return insights;
}

/** Plain-English facts. Kept next to the data so UI and LLM never drift apart. */
function headlines(i: ClanInsights): string[] {
  const out: string[] = [];
  out.push(
    `${i.roster.members}/${i.roster.capacity} members — ${i.activity.active} active, ` +
      `${i.activity.idle} idle, ${i.activity.inactive} inactive (${THRESHOLDS.idleDays}+ days unseen).`,
  );
  out.push(
    `${i.donations.total.toLocaleString()} donations this week — median ${i.donations.median}, ` +
      `${i.donations.zeroDonors} member(s) donated nothing.`,
  );
  if (i.donations.top[0]) {
    out.push(`Top donator: ${i.donations.top[0].name} (${i.donations.top[0].donations}).`);
  }
  if (i.atRisk.length) {
    out.push(`${i.atRisk.length} at-risk (inactive AND not donating): ${i.atRisk.slice(0, 5).map((m) => m.name).join(", ")}.`);
  }
  if (i.promotionCandidates.length) {
    out.push(`Possible elder material: ${i.promotionCandidates.slice(0, 5).map((m) => m.name).join(", ")}.`);
  }
  if (i.roster.openSlots) out.push(`${i.roster.openSlots} slot(s) open for recruiting.`);
  return out;
}
