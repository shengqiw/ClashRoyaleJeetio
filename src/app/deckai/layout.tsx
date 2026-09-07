import type { Metadata } from "next";

// Pages in this folder are client components and can't export metadata, so the
// per-route title/description live here. Titles use the "%s · Jeetio Clash Royale"
// template from the root layout.
export const metadata: Metadata = {
  title: "Deck AI — Clash Royale counter deck finder",
  description: "Name the deck you keep losing to and Deck AI recommends a counter deck built from cards you own, with the reasoning behind each pick.",
  alternates: { canonical: "/deckai" },
  openGraph: { title: "Deck AI — Clash Royale counter deck finder", description: "Name the deck you keep losing to and Deck AI recommends a counter deck built from cards you own, with the reasoning behind each pick.", images: ["/og.png"], url: "/deckai" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
