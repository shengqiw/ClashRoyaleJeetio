import type { Metadata } from "next";

// Pages in this folder are client components and can't export metadata, so the
// per-route title/description live here. Titles use the "%s · Jeetio Clash Royale"
// template from the root layout.
export const metadata: Metadata = {
  title: "Player Profile",
  description: "Clash Royale player profile: trophies, Path of Legend rank, current deck, win rate and donation history.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
