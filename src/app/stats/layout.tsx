import type { Metadata } from "next";

// Pages in this folder are client components and can't export metadata, so the
// per-route title/description live here. Titles use the "%s · Jeetio Clash Royale"
// template from the root layout.
export const metadata: Metadata = {
  title: "Stats Lookup",
  description: "Look up any Clash Royale player by tag for trophies, win rate, current deck and donations, browse any clan's roster, or see the top 50 USA Path of Legend players.",
  alternates: { canonical: "/stats" },
  openGraph: { title: "Stats Lookup", description: "Look up any Clash Royale player by tag for trophies, win rate, current deck and donations, browse any clan's roster, or see the top 50 USA Path of Legend players.", images: ["/og.png"], url: "/stats" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
