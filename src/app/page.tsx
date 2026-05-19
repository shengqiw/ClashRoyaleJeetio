import { Box, Grid, Typography } from "@mui/material";
import { HomeCards } from "@/components/smart/home-cards";

const features = [
  {
    emoji: "🔍",
    title: "Stats Lookup",
    body: "Search any clan to view members OR player tag to view their full profile — trophies, win rate, deck, and donation history. Or look up any clan to browse its full member roster.",
  },
  {
    emoji: "🤖",
    title: "Deck AI",
    body: "Our upcoming AI project analyzes any deck or playstyle and recommends the optimal counter-deck from your card collection. Build smarter, climb faster.",
  },
];

export default function Root() {
  return (
    <>
      <Grid container sx={{ mt: 3 }}>
        <Grid size={8} offset={2} sx={{ textAlign: "center" }}>
          <Typography variant="h3" className="purple-shadow">
            Jeetio Clash Royale
          </Typography>
          <Typography variant="body1" className="purple-shadow" sx={{ mt: 1.5, opacity: 0.85 }}>
            <i>A chill, competitive clan where everyone belongs — war hard, chat harder.</i>
          </Typography>
        </Grid>
      </Grid>
      <Box sx={{ height: "4vh" }} />
      <HomeCards />

      <br className="br" />
      {/* Feature blurbs */}
      <Grid container spacing={4} sx={{ px: { xs: 3, md: 8 }, mt: 5, mb: 1 }}>
        {features.map((f) => (
          <Grid size={{ xs: 12, md: 6 }} key={f.title}>
            <Box
              sx={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "10px",
                padding: { xs: "1.1rem 1.25rem", md: "1.4rem 1.75rem" },
                display: "flex",
                gap: 1.75,
                alignItems: "flex-start",
              }}
            >
              <Typography sx={{ fontSize: "1.8rem", lineHeight: 1, flexShrink: 0, mt: "2px" }}>
                {f.emoji}
              </Typography>
              <Box>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    mb: 0.5,
                  }}
                >
                  {f.title}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.58)",
                    fontSize: "0.85rem",
                    lineHeight: 1.65,
                  }}
                >
                  {f.body}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box className="br" sx={{ mb: 3 }} />
    </>
  );
}
