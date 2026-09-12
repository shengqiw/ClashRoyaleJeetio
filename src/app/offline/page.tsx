import type { Metadata } from "next";
import { Box, Container, Typography } from "@mui/material";
import "../shared.css";
import { RetryButton } from "@/components/dumb/retry-button";

// Precached by public/sw.js and served when a page navigation fails with no
// network and no cached copy of the page. Static — nothing here calls the API.
export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <Box className="game-bg">
      <Container maxWidth="sm">
        <Typography component="h1" className="game-title">
          You&apos;re offline
        </Typography>
        <Typography className="game-subtitle" sx={{ mt: 1, mb: 3 }}>
          No connection — the arena is out of reach.
        </Typography>
        <Box className="game-panel" sx={{ height: "auto" }}>
          <Typography sx={{ color: "rgba(230,255,200,0.82)", fontSize: "0.95rem", lineHeight: 1.7, mb: 2 }}>
            Pages you opened recently still work from cache, but live stats, battle logs
            and Deck AI need the network. Reconnect and try again.
          </Typography>
          <RetryButton />
        </Box>
      </Container>
    </Box>
  );
}
