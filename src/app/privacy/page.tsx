import type { Metadata } from "next";
import { Box, Container, Typography } from "@mui/material";
import "../shared.css";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What jeetio.com collects and why: cookieless analytics, no accounts, no tracking cookies, and public Clash Royale API data only.",
  alternates: { canonical: "/privacy" },
};

const sections: { heading: string; body: string }[] = [
  {
    heading: "What this site is",
    body: "Jeetio is a free, non-profit fan site for a Clash Royale clan. There are no accounts, no sign-ups, no payments and nothing to sell. It is not affiliated with or endorsed by Supercell.",
  },
  {
    heading: "What we collect",
    body: "Google Analytics runs in cookieless mode: every consent type is set to denied, so it never sets a _ga cookie or any other tracking cookie. It receives anonymous, IP-anonymised page-view counts and nothing that identifies you. That is the whole list.",
  },
  {
    heading: "What stays on your device",
    body: "Some tools (Deck AI, Meta Lab) remember your choices — for example the cards you own or a passcode you entered — in your browser's local storage. That data never leaves your browser and you can clear it at any time from your browser settings.",
  },
  {
    heading: "Player and clan data",
    body: "Stats Lookup shows information from the official Clash Royale API for whatever player tag or clan tag you search. This is the same public data the game itself exposes. We do not store it beyond short-lived caching.",
  },
  {
    heading: "Third parties",
    body: "The site is hosted on Vercel and loads Clash Royale card art from Supercell's asset CDN. Each of those providers sees the standard request data (IP address, user agent) needed to serve a page.",
  },
  {
    heading: "Contact",
    body: "Questions about this page or the site: reach the clan leadership in-game via the Jeetio clan chat. The clan tag is on the Clan Info page.",
  },
];

export default function PrivacyPage() {
  return (
    <Box className="game-bg">
      <Container maxWidth="md">
        <Typography component="h1" className="game-title">
          Privacy
        </Typography>
        <Typography className="game-subtitle" sx={{ mt: 1, mb: 3 }}>
          Short version: no tracking cookies, no accounts, nothing sold.
        </Typography>
        {sections.map((s) => (
          <Box key={s.heading} className="game-panel" sx={{ mb: 2, height: "auto" }}>
            <Typography component="h2" className="game-panel-title" sx={{ mb: 1 }}>
              {s.heading}
            </Typography>
            <Typography sx={{ color: "rgba(230,255,200,0.82)", fontSize: "0.95rem", lineHeight: 1.7 }}>
              {s.body}
            </Typography>
          </Box>
        ))}
        <Typography sx={{ color: "rgba(230,255,200,0.5)", fontSize: "0.8rem", mt: 3 }}>
          Last updated September 2026.
        </Typography>
      </Container>
    </Box>
  );
}
