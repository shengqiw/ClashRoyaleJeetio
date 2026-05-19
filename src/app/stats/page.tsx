"use client";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Container,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Groups, Person } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./stats.css";

const DEFAULT_TAG = "PRURJPJP";

const ROLE_ORDER: Record<string, number> = {
  leader: 0,
  coLeader: 1,
  elder: 2,
  member: 3,
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "leader":   return "#B91C1C";
    case "coLeader": return "#92400E";
    case "elder":    return "#1D4ED8";
    case "member":   return "#374151";
    default:         return "#374151";
  }
};

const getRoleLabel = (role: string) => {
  if (role === "coLeader") return "Co-Leader";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

function formatDate(raw: string): string {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return raw;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

type SortKey = "clanRank" | "role" | "donations";
type SearchMode = "clan" | "player";

export default function Stats() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("clan");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTag, setActiveTag] = useState(DEFAULT_TAG);
  const [tagInput, setTagInput] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("clanRank");

  async function fetchMembers(tag: string, fromCache = false) {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/clan/${encodeURIComponent(tag)}/members`, {
        cache: fromCache ? "default" : "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || payload?.reason || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMembers(data?.items || []);
      setActiveTag(tag);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers(DEFAULT_TAG, false);
  }, []);

  function handleSearch() {
    const raw = tagInput.trim();
    if (!raw) return;
    setTagInput("");
    setErrorMessage("");
    if (mode === "player") {
      const playerTag = raw.startsWith("#") ? raw : `#${raw}`;
      router.push(`/member/${encodeURIComponent(playerTag)}`);
    } else {
      fetchMembers(raw.replace(/^#/, ""), false);
    }
  }

  const sorted = [...members].sort((a, b) => {
    if (sortBy === "clanRank")  return a.clanRank - b.clanRank;
    if (sortBy === "role")      return (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9);
    if (sortBy === "donations") return b.donations - a.donations;
    return 0;
  });

  return (
    <Box className="stats-bg">
      {/* Header */}
      <Box className="stats-header">
        <Typography className="stats-title">Stats Lookup</Typography>
        <Typography className="stats-tag-display">
          {mode === "clan" ? `Clan: #${activeTag}` : "Search any player by tag"}
        </Typography>
      </Box>

      <Container maxWidth="lg">
        {/* Controls */}
        <Box className="stats-controls">
          {/* Mode toggle */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => {
                if (v) { setMode(v); setTagInput(""); setErrorMessage(""); }
              }}
              size="small"
              className="stats-mode-group"
            >
              <ToggleButton value="clan">
                <Groups sx={{ fontSize: 16, mr: 0.6 }} />
                Clan
              </ToggleButton>
              <ToggleButton value="player">
                <Person sx={{ fontSize: 16, mr: 0.6 }} />
                Player
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Search row */}
          <Box className="stats-tag-input-row">
            <TextField
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder={
                mode === "clan"
                  ? "Clan tag (e.g. PRURJPJP)"
                  : "Player tag (e.g. #ABC123)"
              }
              size="small"
              className="stats-tag-field"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button className="stats-btn-fetch" onClick={handleSearch}>
              {mode === "clan" ? "Fetch Clan" : "Lookup Player"}
            </Button>
            {mode === "clan" && (
              <Button
                className="stats-btn-default"
                onClick={() => fetchMembers(DEFAULT_TAG, true)}
              >
                Default Clan
              </Button>
            )}
          </Box>

          {/* Sort (clan mode only) */}
          {mode === "clan" && (
            <Box className="stats-sort-row">
              <Typography className="stats-sort-label">Sort by:</Typography>
              <ToggleButtonGroup
                value={sortBy}
                exclusive
                onChange={(_, v) => v && setSortBy(v)}
                size="small"
                className="stats-sort-group"
              >
                <ToggleButton value="clanRank">Rank</ToggleButton>
                <ToggleButton value="role">Role</ToggleButton>
                <ToggleButton value="donations">Donations</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress sx={{ color: "#3B82F6" }} />
          </Box>
        ) : errorMessage ? (
          <Typography
            color="error"
            sx={{ mt: 4, textAlign: "center", fontFamily: "monospace" }}
          >
            {errorMessage}
          </Typography>
        ) : (
          <>
            <Typography className="stats-member-count" sx={{ mb: 2.5 }}>
              {members.length} members
            </Typography>
            <Grid container spacing={2}>
              {sorted.map((member: any) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={member.tag}>
                  <Card
                    className="member-card"
                    sx={{ borderLeft: `3px solid ${getRoleColor(member.role)}` }}
                    onClick={() =>
                      router.push(`/member/${encodeURIComponent(member.tag)}`)
                    }
                  >
                    <CardContent>
                      {/* Name + rank */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1.25,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                          <Typography className="member-name" noWrap>
                            {member.name}
                          </Typography>
                          <Typography className="member-tag">
                            {member.tag}
                          </Typography>
                        </Box>
                        <Chip
                          label={`#${member.clanRank}`}
                          size="small"
                          className="rank-chip"
                        />
                      </Box>

                      {/* Role */}
                      <Box sx={{ mb: 1.25 }}>
                        <Chip
                          label={getRoleLabel(member.role)}
                          size="small"
                          sx={{
                            background: getRoleColor(member.role),
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.67rem",
                            height: 20,
                          }}
                        />
                      </Box>

                      {/* Stats grid */}
                      <Box className="member-stats-grid">
                        <Box className="stat-box">
                          <span className="stat-label">Trophies</span>
                          <span className="stat-value">
                            {member.trophies.toLocaleString()}
                          </span>
                        </Box>
                        <Box className="stat-box">
                          <span className="stat-label">Level</span>
                          <span className="stat-value">{member.expLevel}</span>
                        </Box>
                        <Box className="stat-box">
                          <span className="stat-label">Donated</span>
                          <span className="stat-value">
                            {member.donations.toLocaleString()}
                          </span>
                        </Box>
                        <Box className="stat-box">
                          <span className="stat-label">Received</span>
                          <span className="stat-value">
                            {member.donationsReceived.toLocaleString()}
                          </span>
                        </Box>
                      </Box>

                      {/* Arena + last seen */}
                      <Box
                        sx={{
                          mt: 1.25,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography className="arena-name">
                          {member.arena.name}
                        </Typography>
                        <Typography className="last-seen">
                          {formatDate(member.lastSeen)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}
