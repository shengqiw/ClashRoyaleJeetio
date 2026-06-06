"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import { CloudUpload, Storage, Visibility } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useState } from "react";
import "../shared.css";

// USA location id for the Clash Royale Path of Legend leaderboard.
const USA_LOCATION_ID = "57000249";

type IngestSummary = {
  players: number;
  battlesScanned: number;
  decided: number;
  uniqueMatchups: number;
  upserted: number;
  namespace: string;
};

type NamespaceCount = { namespace: string; count: number; isMeta: boolean };
type IndexOverview = {
  index: string;
  dimension: number | null;
  totalVectorCount: number;
  lastUpdated: string | null;
  namespaces: NamespaceCount[];
  error?: string;
};
type SampleRecord = { id: string; metadata: Record<string, unknown> | null };

/** Key used to track samples/loading per (index, namespace). */
const nsKey = (index: string, namespace: string) => `${index}|${namespace}`;
const nsLabel = (namespace: string) => (namespace === "" ? "(default)" : namespace);

/** One-line human summary of a sampled record's metadata. */
function recordSummary(md: Record<string, unknown> | null): string {
  if (!md) return "(no metadata)";
  const w = md.winnerCards as string[] | undefined;
  const l = md.loserCards as string[] | undefined;
  if (Array.isArray(w) && Array.isArray(l)) {
    const occ = md.occurrences ? `  ×${md.occurrences}` : "";
    return `${w.join(", ")}  ⟶  beats  ⟶  ${l.join(", ")}${occ}`;
  }
  if (typeof md.text === "string") return md.text;
  return JSON.stringify(md);
}

export default function AdminPage() {
  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState("");
  const [progress, setProgress] = useState<Record<string, unknown> | null>(null);

  const [overview, setOverview] = useState<IndexOverview[] | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  // Sampled records + which namespace is currently being sampled.
  const [samples, setSamples] = useState<Record<string, SampleRecord[]>>({});
  const [samplingKey, setSamplingKey] = useState<string | null>(null);
  const [sampleError, setSampleError] = useState("");

  async function loadOverview() {
    setLoadingOverview(true);
    setOverviewError("");
    try {
      const res = await fetch("/api/pinecone/overview", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setOverview(data.indexes ?? []);
    } catch (err) {
      setOverviewError((err as Error).message);
    } finally {
      setLoadingOverview(false);
    }
  }

  async function sampleNamespace(index: string, namespace: string) {
    const key = nsKey(index, namespace);
    setSamplingKey(key);
    setSampleError("");
    try {
      const qs = new URLSearchParams({ index, namespace, limit: "3" });
      const res = await fetch(`/api/pinecone/sample?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSamples((prev) => ({ ...prev, [key]: data.records ?? [] }));
    } catch (err) {
      setSampleError((err as Error).message);
    } finally {
      setSamplingKey(null);
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
            startIcon={loadingOverview ? null : <Storage />}
            onClick={loadOverview}
            disabled={loadingOverview}
            sx={{
              color: "#cef870",
              borderColor: "rgba(110,200,50,0.4)",
              fontWeight: 700,
              "&:hover": { borderColor: "#a0e840", background: "rgba(110,200,50,0.08)" },
            }}
          >
            {loadingOverview ? (
              <CircularProgress size={22} sx={{ color: "#cef870" }} />
            ) : (
              "Load Index Metrics"
            )}
          </Button>
        </Box>

        {/* Cross-index vector metrics */}
        {overview && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {overview.length === 0 && (
              <Typography sx={{ textAlign: "center", color: "#80b848", mb: 3 }}>
                No Pinecone indexes found yet.
              </Typography>
            )}

            {overview.map((idx) => (
              <Box key={idx.index} className="game-panel" sx={{ mb: 3, p: { xs: 2, md: 3 } }}>
                {/* Index header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Typography sx={{ color: "#cef870", fontWeight: 900, fontSize: "1.1rem" }}>
                    <code>{idx.index}</code>
                  </Typography>
                  <Typography sx={{ color: "#80b848", fontSize: "0.8rem" }}>
                    {idx.totalVectorCount.toLocaleString()} vectors
                    {idx.dimension ? ` · ${idx.dimension} dims` : ""}
                    {idx.lastUpdated
                      ? ` · updated ${new Date(idx.lastUpdated).toLocaleString()}`
                      : ""}
                  </Typography>
                </Box>

                {idx.error && (
                  <Typography color="error" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {idx.error}
                  </Typography>
                )}

                {/* Per-namespace counts + sampling */}
                {idx.namespaces.map((ns) => {
                  const key = nsKey(idx.index, ns.namespace);
                  const rows = samples[key];
                  const isSampling = samplingKey === key;
                  return (
                    <Box
                      key={key}
                      sx={{
                        borderTop: "1px solid rgba(110,200,50,0.15)",
                        py: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "#e8ffd0", fontWeight: 700 }}>
                            {nsLabel(ns.namespace)}
                          </Typography>
                          {ns.isMeta && (
                            <Chip
                              label="meta"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.6rem",
                                background: "rgba(110,200,50,0.15)",
                                color: "#80b848",
                              }}
                            />
                          )}
                          <Typography sx={{ color: "#80b848", fontSize: "0.85rem" }}>
                            · {ns.count.toLocaleString()} vectors
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          startIcon={isSampling ? null : <Visibility sx={{ fontSize: 16 }} />}
                          onClick={() => sampleNamespace(idx.index, ns.namespace)}
                          disabled={isSampling || ns.count === 0}
                          sx={{
                            color: "#cef870",
                            fontSize: "0.7rem",
                            minWidth: 0,
                            textTransform: "none",
                          }}
                        >
                          {isSampling ? (
                            <CircularProgress size={14} sx={{ color: "#cef870" }} />
                          ) : (
                            "Sample"
                          )}
                        </Button>
                      </Box>

                      {/* Sampled records */}
                      {rows && (
                        <Box sx={{ mt: 1, pl: { xs: 0, md: 1 } }}>
                          {rows.length === 0 && (
                            <Typography sx={{ color: "#80b848", fontSize: "0.78rem" }}>
                              (no records returned)
                            </Typography>
                          )}
                          {rows.map((r) => (
                            <Box
                              key={r.id}
                              sx={{
                                background: "rgba(0,0,0,0.25)",
                                borderRadius: 1,
                                p: 1,
                                mb: 0.75,
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "#6e9a3c",
                                  fontFamily: "monospace",
                                  fontSize: "0.65rem",
                                  wordBreak: "break-all",
                                }}
                              >
                                {r.id}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "#e8ffd0",
                                  fontSize: "0.78rem",
                                  lineHeight: 1.4,
                                }}
                              >
                                {recordSummary(r.metadata)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </motion.div>
        )}

        {ingesting && (
          <Typography sx={{ textAlign: "center", color: "#80b848", mb: 2, fontSize: "0.85rem" }}>
            {progressLabel(progress)}
          </Typography>
        )}

        {/* Errors */}
        {(ingestError || overviewError || sampleError) && (
          <Typography color="error" sx={{ textAlign: "center", mb: 2, fontFamily: "monospace" }}>
            {ingestError || overviewError || sampleError}
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
      </Container>
    </Box>
  );
}
