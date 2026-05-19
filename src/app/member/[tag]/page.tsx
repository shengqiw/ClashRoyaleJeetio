"use client";
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "./member.css";

const getRoleColor = (role: string) => {
  switch (role) {
    case "leader":   return "#d03030";
    case "coLeader": return "#d07820";
    case "elder":    return "#1e9ac0";
    case "member":   return "#4aaa80";
    default:         return "#4aaa80";
  }
};

const getRoleLabel = (role: string) => {
  if (role === "coLeader") return "Co-Leader";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

function StatPanel({ label, value }: { label: string; value?: string | number }) {
  if (value == null) return null;
  return (
    <Grid size={{ xs: 6, sm: 4 }}>
      <Box className="stat-panel">
        <Typography className="stat-panel-label">{label}</Typography>
        <Typography className="stat-panel-value">
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
      </Box>
    </Grid>
  );
}

export default function MemberPage() {
  const params = useParams();
  const router = useRouter();
  const tag = decodeURIComponent(params.tag as string);

  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/player/${encodeURIComponent(tag)}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(
            payload?.message || payload?.reason || `HTTP ${res.status}`
          );
        }
        setPlayer(await res.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tag]);

  return (
    <Box className="member-page-bg">
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Button className="back-btn" onClick={() => router.back()} sx={{ mb: 2.5 }}>
          ← Back to Clan Stats
        </Button>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress sx={{ color: "#90e040" }} />
          </Box>
        ) : error ? (
          <Typography
            color="error"
            sx={{ mt: 4, textAlign: "center", fontFamily: "monospace" }}
          >
            {error}
          </Typography>
        ) : player ? (
          <Box className="player-profile">
            {/* Header */}
            <Box className="player-header">
              <Box>
                <Typography className="player-name">{player.name}</Typography>
                <Typography className="player-tag-text">{player.tag}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Chip label={`LVL ${player.expLevel}`} size="small" className="level-chip" />
                {player.role && (
                  <Chip
                    label={getRoleLabel(player.role)}
                    size="small"
                    sx={{
                      background: getRoleColor(player.role),
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.67rem",
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Clan + Arena */}
            {player.clan && (
              <Box className="info-row">
                <Typography className="info-label">Clan</Typography>
                <Typography className="info-value">{player.clan.name}</Typography>
              </Box>
            )}
            {player.arena && (
              <Box className="info-row">
                <Typography className="info-label">Arena</Typography>
                <Typography className="info-value">{player.arena.name}</Typography>
              </Box>
            )}

            {/* Battle stats */}
            <Divider className="player-divider" />
            <Typography className="section-heading">Battle Stats</Typography>
            <Grid container spacing={1.5}>
              <StatPanel label="Trophies"     value={player.trophies} />
              <StatPanel label="Best Trophies" value={player.bestTrophies} />
              <StatPanel label="Wins"         value={player.wins} />
              <StatPanel label="Losses"       value={player.losses} />
              <StatPanel label="Battles"      value={player.battleCount} />
              <StatPanel label="3-Crown Wins" value={player.threeCrownWins} />
            </Grid>

            {/* Donations */}
            <Divider className="player-divider" />
            <Typography className="section-heading">Donations</Typography>
            <Grid container spacing={1.5}>
              <StatPanel label="Donated"       value={player.donations} />
              <StatPanel label="Received"      value={player.donationsReceived} />
              <StatPanel label="Total Donated" value={player.totalDonations} />
            </Grid>

            {/* Challenges */}
            {(player.challengeCardsWon != null || player.challengeMaxWins != null) && (
              <>
                <Divider className="player-divider" />
                <Typography className="section-heading">Challenges</Typography>
                <Grid container spacing={1.5}>
                  <StatPanel label="Cards Won"        value={player.challengeCardsWon} />
                  <StatPanel label="Max Wins"         value={player.challengeMaxWins} />
                  <StatPanel label="Tournament Cards" value={player.tournamentCardsWon} />
                </Grid>
              </>
            )}

            {/* Current deck */}
            {player.currentDeck?.length > 0 && (
              <>
                <Divider className="player-divider" />
                <Typography className="section-heading">Current Deck</Typography>
                <Box className="deck-grid">
                  {player.currentDeck.map((card: any) => (
                    <Box key={card.id} className="deck-card">
                      <Typography className="deck-card-name">{card.name}</Typography>
                      <Typography className="deck-card-level">LVL {card.level}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}
