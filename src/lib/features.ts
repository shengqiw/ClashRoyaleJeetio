/**
 * Site map + feature registry — ONE list, and the nav and home cards both read it.
 *
 * WHY THIS EXISTS: the nav used to be hand-written and pointed at /deckai and
 * /contact, neither of which was ever built, while /stats, /rules and /promotions
 * were reachable only from the home page. Registering routes in one place makes
 * that class of drift impossible.
 *
 * ADDING A FEATURE:
 *   1. add an entry below with status "planned" (documents intent, renders nowhere)
 *   2. create src/app/<href>/page.tsx
 *   3. flip status to "live" — it appears in the nav, and on the home page if it
 *      has a `card`
 * GET /api/health echoes this list, so a Claude session can see what exists and
 * what is only aspirational without reading every file.
 */

import type { StaticImageData } from "next/image";
import explorer from "@/assets/explorer.jpg";
import pekka from "@/assets/pekka.jpg";
import battleHealer from "@/assets/battle-healer.jpg";

export type FeatureStatus = "live" | "planned";

export type Feature = {
  /** Stable id. Used in logs and in /api/health — do not rename casually. */
  key: string;
  title: string;
  href: string;
  /** One line, shown nowhere yet; it is the spec for whoever builds it. */
  blurb: string;
  status: FeatureStatus;
  /** Show in the top nav bar. */
  inNav: boolean;
  /** Present = gets a tile on the home page. */
  card?: { image: StaticImageData; styleProps?: Record<string, string> };
};

export const FEATURES: Feature[] = [
  {
    key: "home",
    title: "Home",
    href: "/",
    blurb: "Landing page with the feature tiles.",
    status: "live",
    inNav: true,
  },
  {
    key: "stats",
    title: "Stats",
    href: "/stats",
    blurb: "Live clan roster, derived pulse metrics, and the AI coach.",
    status: "live",
    inNav: true,
    card: { image: pekka },
  },
  {
    key: "rules",
    title: "Rules",
    href: "/rules",
    blurb: "Clan rules and expectations.",
    status: "live",
    inNav: true,
    card: { image: explorer },
  },
  {
    key: "promotions",
    title: "Promotions",
    href: "/promotions",
    blurb: "Role ladder and what each promotion requires.",
    status: "live",
    inNav: true,
    card: { image: battleHealer, styleProps: { backgroundPosition: "25%" } },
  },
  {
    key: "deck-ai",
    title: "Deck AI",
    href: "/deckai",
    blurb:
      "Paste or look up a player tag, fetch ONE /api/player, and have src/lib/llm.ts critique their current deck. One click = one fetch; never loop the roster.",
    status: "planned",
    inNav: false,
  },
  {
    key: "player-lookup",
    title: "Look Up",
    href: "/lookup",
    blurb:
      "Search a single player tag and show their card levels and war record via GET /api/player.",
    status: "planned",
    inNav: false,
  },
];

export const liveFeatures = () => FEATURES.filter((f) => f.status === "live");
export const navFeatures = () => FEATURES.filter((f) => f.status === "live" && f.inNav);
export const cardFeatures = () => FEATURES.filter((f) => f.status === "live" && f.card);
