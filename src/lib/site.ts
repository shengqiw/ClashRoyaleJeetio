// Single source of truth for site identity. Imported by layout metadata,
// sitemap.ts, robots.ts and the JSON-LD block — change it here, not in five places.
export const SITE_URL = "https://www.jeetio.com";
export const SITE_NAME = "Jeetio Clash Royale";
export const SITE_DESCRIPTION =
  "Jeetio is a chill, competitive Clash Royale clan. Look up any player or clan's stats, browse the top Path of Legend ladder, and use Deck AI to find the counter to any deck.";

/** Public, indexable pages. Used by sitemap.ts and llms.txt — keep in sync. */
export const PUBLIC_PAGES: { path: string; title: string; description: string }[] = [
  { path: "/", title: SITE_NAME, description: SITE_DESCRIPTION },
  {
    path: "/clan-info",
    title: "Clan Info",
    description:
      "About the Jeetio Clash Royale clan: who we are, how we play, clan rules, ranks, and the path to leadership.",
  },
  {
    path: "/stats",
    title: "Stats Lookup",
    description:
      "Look up any Clash Royale player by tag for trophies, win rate, current deck and donations, browse any clan's roster, or see the top 50 USA Path of Legend players.",
  },
  {
    path: "/deckai",
    title: "Deck AI — Clash Royale counter deck finder",
    description:
      "Name the deck you keep losing to and Deck AI recommends a counter deck built from cards you own, with the reasoning behind each pick.",
  },
  {
    path: "/rules",
    title: "Clan Rules",
    description: "Jeetio clan rules: donations, war participation, activity, and how to stay in good standing.",
  },
  {
    path: "/promotions",
    title: "Clan Progression",
    description: "How promotions work in Jeetio: member to elder to co-leader, and what each rank expects of you.",
  },
  {
    path: "/privacy",
    title: "Privacy",
    description: "What jeetio.com collects and why: cookieless analytics, no accounts, no tracking cookies.",
  },
];
