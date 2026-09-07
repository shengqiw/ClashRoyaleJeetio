import type { Metadata } from "next";

// Pages in this folder are client components and can't export metadata, so the
// per-route title/description live here. Titles use the "%s · Jeetio Clash Royale"
// template from the root layout.
export const metadata: Metadata = {
  title: "Clan Rules",
  description: "Jeetio clan rules: donations, war participation, activity, and how to stay in good standing.",
  alternates: { canonical: "/rules" },
  openGraph: { title: "Clan Rules", description: "Jeetio clan rules: donations, war participation, activity, and how to stay in good standing.", images: ["/og.png"], url: "/rules" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
