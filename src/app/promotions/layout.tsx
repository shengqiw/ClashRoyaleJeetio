import type { Metadata } from "next";

// Pages in this folder are client components and can't export metadata, so the
// per-route title/description live here. Titles use the "%s · Jeetio Clash Royale"
// template from the root layout.
export const metadata: Metadata = {
  title: "Clan Progression",
  description: "How promotions work in Jeetio: member to elder to co-leader, and what each rank expects of you.",
  alternates: { canonical: "/promotions" },
  openGraph: { title: "Clan Progression", description: "How promotions work in Jeetio: member to elder to co-leader, and what each rank expects of you.", images: ["/og.png"], url: "/promotions" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
