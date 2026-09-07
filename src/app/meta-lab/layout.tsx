import type { Metadata } from "next";

// Operator / passcode page — keep it out of search results and link previews.
export const metadata: Metadata = {
  title: "Meta Lab",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
