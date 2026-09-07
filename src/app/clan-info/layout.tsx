import type { Metadata } from "next";

// Pages in this folder are client components and can't export metadata, so the
// per-route title/description live here. Titles use the "%s · Jeetio Clash Royale"
// template from the root layout.
export const metadata: Metadata = {
  title: "Clan Info",
  description: "About the Jeetio Clash Royale clan: who we are, how we play, clan rules, ranks, and the path to leadership.",
  alternates: { canonical: "/clan-info" },
  openGraph: { title: "Clan Info", description: "About the Jeetio Clash Royale clan: who we are, how we play, clan rules, ranks, and the path to leadership.", images: ["/og.png"], url: "/clan-info" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
