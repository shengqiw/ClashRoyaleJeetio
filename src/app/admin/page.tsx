"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { Leaderboard, CloudUpload, Storage } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useState } from "react";
import "../shared.css";

// USA location id for the Clash Royale Path of Legend leaderboard.
const USA_LOCATION_ID = "57000249";

type Player = {
  rank: number;
  tag: string;
  name: string;
  eloRating: number | null;
  expLevel: number | null;
  clan: string | null;
};

type IngestSummary = {
  players: number;
  battlesScanned: number;
  decided: number;
  uniqueMatchups: number;
  upserted: number;
  namespace: string;
};

type PineconeStats = {
  index: string;
  dimension: number;
  totalVectorCount: number;
  lastUpdated: string | null;
};

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [topError, setTopError] = useState("");

  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState("");
  const [progress, setProgress] = useState<Record<string, unknown> | null>(null);

  const [stats, setStats] = useState<PineconeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState("");

  async function loadStats() {
    setLoadingStats(true);
    setStatsError("");
    try {
      const res = await fetch("/api/pinecone/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setStats(data);
    } catch (err) {
      setStatsError((err as Error).message);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadTop() {
    setLoadingTop(true);
    setTopError("");
    try {
      const res = await fetch(`/api/pathoflegend/${USA_LOCATION_ID}/top?limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setPlayers(data.players || []);
    } catch (err) {
      setTopError((err as Error).message);
    } finally {
      setLoadingTop(false);
    }
  }

  async function runIngest() {
    setIngesting(true);
    setIngestError("");
    setSummary(null);
    setProgress(null);
    try {
      // 1) Kick off the background job — returns immediately with a job id.
      const startRes = await fetch(`/api/pathoflegend/${USA_LOCATION_ID}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const start = await startRes.json();
      if (!startRes.ok) throw new Error(start?.error || `HTTP ${startRes.status}`);

      // 2) Poll the job until it finishes (cap at ~5 min as a safety net).
      const jobId = start.jobId as string;
      for (let i = 0; i < 150; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const jobRes = await fetch(`/api/jobs/${jobId}`);
        const job = await jobRes.json();
        if (!jobRes.ok) throw new Error(job?.error || `HTTP ${jobRes.status}`);

        setProgress(job.progress || null);
        if (job.status === "done") {
          setSummary(job.summary);
          return;
        }
        if (job.status === "error") {
          throw new Error(job.error || "Ingest job failed");
        }
      }
      throw new Error("Ingest timed out while polling (still running on the server)");
    } catch (err) {
      setIngestError((err as Error).message);
    } finally {
      setIngesting(false);
    }
  }

  function progressLabel(p: Record<string, unknown> | null): string {
    if (!p) return "Starting…";
    if (p.phase === "players") return `Fetched ${p.players} top players…`;
    if (p.phase === "battlelogs")
      return `Pulling battle logs (${p.logsFetched}/${p.players})…`;
    if (p.phase === "embedding")
      return `Embedding ${p.uniqueMatchups} unique matchups → Pinecone…`;
    return "Working…";
  }

  const metricCards = summary
    ? [
        { label: "Players Scanned", value: summary.players },
        { label: "Battles Scanned", value: summary.battlesScanned },
        { label: "Unique Matchups", value: summary.uniqueMatchups },
        { label: "Vectors Upserted", value: summary.upserted },
      ]
    : [];

  return (
    <Box className="game-bg">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <Typography className="game-title">Admin · Embeddings</Typography>
          <Typography className="game-subtitle" sx={{ mt: 1 }}>
            Top 50 USA Path of Legend players → deck-matchup embeddings
          </Typography>
        </motion.div>

        {/* Action buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
            mb: 3,
          }}
        >
          <Button
            variant="contained"
            startIcon={loadingTop ? null : <Leaderboard />}
            onClick={loadTop}
            disabled={loadingTop}
            sx={{ background: "#3B82F6", fontWeight: 700 }}
          >
            {loadingTop ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Show Top 50 (USA)"}
          </Button>

          <Button
            variant="contained"
            startIcon={ingesting ? null : <CloudUpload />}
            onClick={runIngest}
            disabled={ingesting}
            sx={{ background: "#a0e840", color: "#0a1a06", fontWeight: 800 }}
          >
            {ingesting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "#0a1a06" }} />
                Embedding…
              </Box>
            ) : (
              "Ingest Battle Logs → Pinecone"
            )}
          </Button>

          <Button
            variant="outlined"
            startIcon={loadingStats ? null : <Storage />}
            onClick={loadStats}
            disabled={loadingStats}
            sx={{
              color: "#cef870",
              borderColor: "rgba(110,200,50,0.4)",
              fontWeight: 700,
              "&:hover": { borderColor: "#a0e840", background: "rgba(110,200,50,0.08)" },
            }}
          >
            {loadingStats ? (
              <CircularProgress size={22} sx={{ color: "#cef870" }} />
            ) : (
              "Pinecone Index Stats"
            )}
          </Button>
        </Box>

        {/* Pinecone index stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4, justifyContent: "center" }}>
              <Grid size={{ xs: 6, md: 4 }}>
                <Box className="game-panel" sx={{ textAlign: "center" }}>
                  <Typography sx={{ color: "#cef870", fontWeight: 900, fontSize: "1.8rem" }}>
                    {stats.totalVectorCount.toLocaleString()}
                  </Typography>
                  <Typography
                    className="game-section-label"
                    sx={{ mt: 1, justifyContent: "center" }}
                  >
                    Total Vectors
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <Box className="game-panel" sx={{ textAlign: "center" }}>
                  <Typography sx={{ color: "#cef870", fontWeight: 900, fontSize: "1.05rem", lineHeight: 1.3 }}>
                    {stats.lastUpdated
                      ? new Date(stats.lastUpdated).toLocaleString()
                      : "—"}
                  </Typography>
                  <Typography
                    className="game-section-label"
                    sx={{ mt: 1, justifyContent: "center" }}
                  >
                    Last Updated
                  </Typography>
                </Box>
              </Grid>
              <Grid size={12}>
                <Typography sx={{ textAlign: "center", color: "#80b848", fontSize: "0.8rem" }}>
                  Index <code style={{ color: "#cef870" }}>{stats.index}</code> · {stats.dimension} dims
                </Typography>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {ingesting && (
          <Typography sx={{ textAlign: "center", color: "#80b848", mb: 2, fontSize: "0.85rem" }}>
            {progressLabel(progress)}
          </Typography>
        )}

        {/* Errors */}
        {(topError || ingestError || statsError) && (
          <Typography color="error" sx={{ textAlign: "center", mb: 2, fontFamily: "monospace" }}>
            {topError || ingestError || statsError}
          </Typography>
        )}

        {/* Ingest summary metrics */}
        {summary && (
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
            {metricCards.map((m, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={m.label}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * (i + 1), duration: 0.4 }}
                >
                  <Box className="game-panel" sx={{ textAlign: "center" }}>
                    <Typography sx={{ color: "#cef870", fontWeight: 900, fontSize: "1.8rem" }}>
                      {m.value.toLocaleString()}
                    </Typography>
                    <Typography
                      className="game-section-label"
                      sx={{ mt: 1, justifyContent: "center" }}
                    >
                      {m.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
            <Grid size={12}>
              <Typography sx={{ textAlign: "center", color: "#80b848", fontSize: "0.8rem" }}>
                Stored in Pinecone namespace{" "}
                <code style={{ color: "#cef870" }}>{summary.namespace}</code>
              </Typography>
            </Grid>
          </Grid>
        )}

        {/* Top 50 table */}
        {players.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Box className="game-panel" sx={{ overflowX: "auto" }}>
              <Typography className="game-panel-title" sx={{ mb: 1.5 }}>
                Top {players.length} · USA Path of Legend
              </Typography>
              <Table size="small" sx={{ "& td, & th": { borderColor: "rgba(110,200,50,0.13)" } }}>
                <TableHead>
                  <TableRow>
                    {["Rank", "Player", "Elo", "Clan"].map((h) => (
                      <TableCell key={h} sx={{ color: "#80b848", fontWeight: 800, fontSize: "0.72rem" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.map((p) => (
                    <TableRow key={p.tag}>
                      <TableCell>
                        <Chip
                          label={`#${p.rank}`}
                          size="small"
                          sx={{
                            background: p.rank <= 3 ? "#a0e840" : "rgba(110,200,50,0.18)",
                            color: p.rank <= 3 ? "#0a1a06" : "#c0e878",
                            fontWeight: 800,
                            height: 20,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "#d4f878", fontWeight: 600 }}>{p.name}</TableCell>
                      <TableCell sx={{ color: "#c0e878" }}>{p.eloRating ?? "—"}</TableCell>
                      <TableCell sx={{ color: "#80b848", fontSize: "0.8rem" }}>{p.clan ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </motion.div>
        )}
      </Container>
    </Box>
  );
}
