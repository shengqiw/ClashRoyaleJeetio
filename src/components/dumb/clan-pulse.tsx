import { Box, Chip, Grid2 as Grid, Paper, Typography } from "@mui/material";
import type { ClanInsights } from "@/lib/insights";

/**
 * Presentational strip for the derived clan metrics. All arithmetic happens in
 * src/lib/insights.ts — this file only decides what a number looks like. Costs
 * zero API calls: it reads the clan payload /stats already fetched.
 */

const PANEL = { bgcolor: "rgba(0,0,0,0.55)", borderRadius: 2, p: 2, height: "100%" };

const Stat = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
  <Paper elevation={0} sx={{ ...PANEL, textAlign: "center" }}>
    <Typography variant="h3" sx={{ color, fontWeight: 700, lineHeight: 1.1 }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", letterSpacing: 1 }}>
      {label.toUpperCase()}
    </Typography>
  </Paper>
);

const NameList = ({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ label: string; detail: string }>;
}) => (
  <Paper elevation={0} sx={PANEL}>
    <Typography variant="h6" className="gold" mb={1}>
      {title}
    </Typography>
    {items.length === 0 ? (
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
        {empty}
      </Typography>
    ) : (
      items.slice(0, 6).map((it) => (
        <Box key={it.label} display="flex" justifyContent="space-between" gap={2} py={0.4}>
          <Typography variant="body2" sx={{ color: "gold" }}>
            {it.label}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
            {it.detail}
          </Typography>
        </Box>
      ))
    )}
  </Paper>
);

export const ClanPulse = ({ insights }: { insights: ClanInsights }) => (
  <Box maxWidth={1100} mx="auto" px={2}>
    <Typography variant="h4" className="gold-shadow center" mb={2}>
      Clan Pulse
    </Typography>

    <Grid container spacing={2}>
      <Grid size={{ xs: 6, md: 3 }}>
        <Stat label="Active" value={insights.activity.active} color="#4ade80" />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Stat label="Idle" value={insights.activity.idle} color="#fbbf24" />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Stat label="Inactive" value={insights.activity.inactive} color="#f87171" />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Stat label="Open slots" value={insights.roster.openSlots} color="#60a5fa" />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <NameList
          title="Top donators"
          empty="No donations recorded this week."
          items={insights.donations.top.map((d) => ({ label: d.name, detail: `${d.donations}` }))}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <NameList
          title="Longest unseen"
          empty="Everyone has logged in recently."
          items={insights.activity.inactiveMembers.map((m) => ({
            label: m.name,
            detail: m.daysSinceSeen === null ? "unknown" : `${m.daysSinceSeen}d`,
          }))}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <NameList
          title="Elder shortlist"
          empty="No members clear the donation + activity bar right now."
          items={insights.promotionCandidates.map((m) => ({
            label: m.name,
            detail: `${m.donations} donated`,
          }))}
        />
      </Grid>
    </Grid>

    <Box mt={2} display="flex" gap={1} flexWrap="wrap" justifyContent="center">
      {insights.headlines.map((h) => (
        <Chip
          key={h}
          label={h}
          size="small"
          sx={{ bgcolor: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)" }}
        />
      ))}
    </Box>
    <Typography
      variant="caption"
      display="block"
      textAlign="center"
      mt={1}
      sx={{ color: "rgba(255,255,255,0.45)" }}
    >
      Elder shortlist is a heuristic on donations + activity — the clan payload carries no
      war medals. Thresholds live in src/lib/insights.ts.
    </Typography>
  </Box>
);
