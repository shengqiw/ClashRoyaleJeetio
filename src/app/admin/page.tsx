"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CloudUpload,
  Visibility,
  Hub,
  DeleteOutlined,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import "../shared.css";

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

// Summary returned by the battle-graph ingest job.
type GraphSummary = {
  rootTag: string;
  seeds?: number;
  playersCrawled: number;
  battlesScanned: number;
  decided: number;
  uniqueMatchups: number;
  upserted: number;
  index: string;
  namespace: string;
};

// One persisted ingestion-history row.
type HistoryEntry = {
  ts: number;
  rootTag: string;
  index: string;
  seeds: number;
  playersCrawled: number;
  battlesScanned: number;
  uniqueMatchups: number;
  upserted: number;
};

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

// ── Ingestion history (persisted in localStorage so it survives reloads) ──
const HISTORY_KEY = "admin:ingestHistory";
const HISTORY_MAX = 50;

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(list: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch {
    // storage unavailable / quota — ignore
  }
}

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  const [overview, setOverview] = useState<IndexOverview[] | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  // Sampled records + which namespace is currently being sampled.
  const [samples, setSamples] = useState<Record<string, SampleRecord[]>>({});
  const [samplingKey, setSamplingKey] = useState<string | null>(null);
  const [sampleError, setSampleError] = useState("");

  const [deletingIndex, setDeletingIndex] = useState<string | null>(null);

  // Battle-graph ingest (shared for the global crawl and per-tag crawls — only
  // one runs at a time).
  const [graphTag, setGraphTag] = useState("P92LLUR8");
  const [ingesting, setIngesting] = useState(false);
  const [ingestKind, setIngestKind] = useState<"global" | "tag" | null>(null);
  const [ingestProgress, setIngestProgress] = useState<Record<string, unknown> | null>(null);
  const [ingestError, setIngestError] = useState("");
  // True when this press attached to a crawl that was already running (the
  // backend's one-at-a-time guard returned the in-flight job).
  const [ingestAttached, setIngestAttached] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function deleteIndexByName(name: string) {
    if (
      !window.confirm(
        `Delete Pinecone index "${name}"? This removes all its vectors and cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingIndex(name);
    setOverviewError("");
    try {
      const res = await fetch(`/api/pinecone/index/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      await loadOverview();
    } catch (err) {
      setOverviewError((err as Error).message);
    } finally {
      setDeletingIndex(null);
    }
  }

  /**
   * Run a 3-layer battle-graph crawl. kind="global" seeds from the top 50 global
   * players into cr-bg-global; kind="tag" seeds from one player into cr-bg-<tag>.
   */
  async function runIngest(rawSeed: string, kind: "global" | "tag") {
    const seed = kind === "global" ? "global" : rawSeed.trim().replace(/^#/, "");
    if (!seed) {
      setIngestError("Enter a player tag.");
      return;
    }
    setIngesting(true);
    setIngestKind(kind);
    setIngestError("");
    setIngestProgress(null);
    setIngestAttached(false);
    try {
      const startRes = await fetch(`/api/meta-graph/${encodeURIComponent(seed)}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const start = await startRes.json();
      if (!startRes.ok) throw new Error(start?.error || `HTTP ${startRes.status}`);
      // The backend returns alreadyRunning when our request attached to an
      // in-flight crawl instead of starting a new one.
      setIngestAttached(Boolean(start.alreadyRunning));

      // The crawl is heavy (50 seeds × 3 layers for global) — poll up to ~20 min.
      const jobId = start.jobId as string;
      for (let i = 0; i < 600; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const jobRes = await fetch(`/api/jobs/${jobId}`);
        const job = await jobRes.json();
        if (!jobRes.ok) throw new Error(job?.error || `HTTP ${jobRes.status}`);

        setIngestProgress(job.progress || null);
        if (job.status === "done") {
          const s = job.summary as GraphSummary;
          const entry: HistoryEntry = {
            ts: Date.now(),
            rootTag: s.rootTag,
            index: s.index,
            seeds: s.seeds ?? 1,
            playersCrawled: s.playersCrawled,
            battlesScanned: s.battlesScanned,
            uniqueMatchups: s.uniqueMatchups,
            upserted: s.upserted,
          };
          setHistory((prev) => {
            const next = [entry, ...prev];
            saveHistory(next);
            return next;
          });
          await loadOverview();
          return;
        }
        if (job.status === "error") {
          throw new Error(job.error || "Battle-graph ingest failed");
        }
      }
      throw new Error("Ingest timed out while polling (still running on the server)");
    } catch (err) {
      setIngestError((err as Error).message);
    } finally {
      setIngesting(false);
      setIngestKind(null);
    }
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  function progressLabel(p: Record<string, unknown> | null): string {
    if (!p) return "Starting…";
    if (p.phase === "crawling") {
      const seeds = Number(p.seeds) || 0;
      const layers = Number(p.layers) || 0;
      // Ceiling is the SUM of per-layer fan-out (seeds·25^0 + … + seeds·25^(L-1)),
      // not seeds·25^L — layers add, they don't compound an extra level. Geometric
      // series with branch factor 25: seeds·(25^L − 1)/24. For 50 seeds × 3 layers
      // that's ~32.5k, not the ~781k the old multiply implied.
      const ub =
        seeds && layers
          ? ` (≤ ${Math.round(
              (seeds * (25 ** layers - 1)) / 24
            ).toLocaleString()})`
          : "";
      return `Crawling layer ${p.layer}/${p.layers} · ${Number(
        p.playersCrawled
      ).toLocaleString()} players${ub} · ${Number(
        p.battlesCollected
      ).toLocaleString()} battles…`;
    }
    if (p.phase === "clustering")
      return `Grouping matchups · ${Number(p.processed).toLocaleString()}/${Number(
        p.total
      ).toLocaleString()} battles · ${Number(
        p.uniqueMatchups
      ).toLocaleString()} unique so far…`;
    if (p.phase === "embedding")
      return `Embedding ${Number(p.uniqueMatchups).toLocaleString()} unique matchups → Pinecone…`;
    return "Working…";
  }

  /**
   * Percent complete for the progress bar, or null to render an indeterminate
   * bar (phases without a known denominator). Crawling is measured per layer —
   * how many of THIS layer's frontier players have been fetched — so the bar
   * fills 0→100% once for each layer (the label shows "layer X/Y"). This avoids
   * the dedup gap of measuring against a never-reached theoretical ceiling.
   */
  function progressPercent(p: Record<string, unknown> | null): number | null {
    if (!p) return null;
    if (p.phase === "crawling") {
      const frontierSize = Number(p.frontierSize) || 0;
      if (!frontierSize) return null;
      const fetched = Number(p.playersFetched) || 0;
      return Math.max(0, Math.min(100, (fetched / frontierSize) * 100));
    }
    if (p.phase === "clustering") {
      const total = Number(p.total) || 0;
      if (!total) return null;
      return Math.max(0, Math.min(100, (Number(p.processed) || 0) / total * 100));
    }
    return null; // embedding / startup → indeterminate
  }

  const tabSx = {
    color: "#80b848",
    fontWeight: 800,
    fontFamily: "monospace",
    "&.Mui-selected": { color: "#cef870" },
  };

  return (
    <Box className="game-bg">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography className="game-title">Admin · Embeddings</Typography>
          <Typography className="game-subtitle" sx={{ mt: 1 }}>
            Battle-graph deck-matchup vectors (cr-bg-*)
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          centered
          sx={{
            mb: 3,
            "& .MuiTabs-indicator": { background: "#a0e840" },
          }}
        >
          <Tab label="Vector Indexes" sx={tabSx} />
          <Tab label="Ingestion History" sx={tabSx} />
        </Tabs>

        {/* ─────────────── Tab 0: Vector Indexes ─────────────── */}
        {tab === 0 && (
          <>
            {/* Global ingest (separate, uniform cr-bg-global index) */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
                mb: 1.5,
              }}
            >
              <Button
                variant="contained"
                startIcon={
                  ingesting && ingestKind === "global" ? null : <CloudUpload />
                }
                onClick={() => runIngest("global", "global")}
                disabled={ingesting}
                sx={{ background: "#a0e840", color: "#0a1a06", fontWeight: 800 }}
              >
                {ingesting && ingestKind === "global" ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: "#0a1a06" }} />
                    Crawling…
                  </Box>
                ) : (
                  "Ingest Top 50 Global → cr-bg-global"
                )}
              </Button>
            </Box>

            {/* Shared ingest status + progress bar */}
            {ingesting && (
              <Box sx={{ maxWidth: 560, mx: "auto", mb: 2 }}>
                {ingestAttached && (
                  <Typography
                    sx={{ textAlign: "center", color: "#cef870", fontSize: "0.78rem", mb: 0.5 }}
                  >
                    A crawl is already running — showing its live progress.
                  </Typography>
                )}
                <Typography
                  sx={{ textAlign: "center", color: "#80b848", mb: 0.75, fontSize: "0.85rem" }}
                >
                  {progressLabel(ingestProgress)}
                  {(() => {
                    const pct = progressPercent(ingestProgress);
                    return pct != null ? `  ·  ${pct.toFixed(0)}%` : "";
                  })()}
                </Typography>
                <LinearProgress
                  variant={
                    progressPercent(ingestProgress) != null ? "determinate" : "indeterminate"
                  }
                  value={progressPercent(ingestProgress) ?? undefined}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(110,200,50,0.15)",
                    "& .MuiLinearProgress-bar": { backgroundColor: "#a0e840" },
                  }}
                />
              </Box>
            )}
            {ingestError && (
              <Typography
                color="error"
                sx={{ textAlign: "center", mb: 2, fontFamily: "monospace", fontSize: "0.85rem" }}
              >
                {ingestError}
              </Typography>
            )}

            {/* Refresh row */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Button
                size="small"
                onClick={loadOverview}
                disabled={loadingOverview}
                sx={{ color: "#cef870", textTransform: "none", fontSize: "0.75rem" }}
              >
                {loadingOverview ? (
                  <CircularProgress size={16} sx={{ color: "#cef870" }} />
                ) : (
                  "↻ Refresh"
                )}
              </Button>
            </Box>

            {overviewError && (
              <Typography
                color="error"
                sx={{ textAlign: "center", mb: 2, fontFamily: "monospace", fontSize: "0.85rem" }}
              >
                {overviewError}
              </Typography>
            )}

            {overview && overview.length === 0 && (
              <Typography sx={{ textAlign: "center", color: "#80b848", mb: 3 }}>
                No Pinecone indexes yet — ingest one below.
              </Typography>
            )}

            {/* Index list */}
            {overview?.map((idx) => (
              <Box key={idx.index} className="game-panel" sx={{ mb: 2, p: { xs: 2, md: 3 } }}>
                {/* Index header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box>
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

                  <Button
                    size="small"
                    startIcon={
                      deletingIndex === idx.index ? (
                        <CircularProgress size={16} sx={{ color: "#ff9a9a" }} />
                      ) : (
                        <DeleteOutlined sx={{ fontSize: 18 }} />
                      )
                    }
                    onClick={() => deleteIndexByName(idx.index)}
                    disabled={deletingIndex === idx.index}
                    sx={{
                      color: "#ff9a9a",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      "&:hover": { background: "rgba(255,80,80,0.08)" },
                    }}
                  >
                    {deletingIndex === idx.index ? "Deleting…" : "Delete"}
                  </Button>
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
                    <Box key={key} sx={{ borderTop: "1px solid rgba(110,200,50,0.15)", py: 1.25 }}>
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
                              sx={{ background: "rgba(0,0,0,0.25)", borderRadius: 1, p: 1, mb: 0.75 }}
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
                              <Typography sx={{ color: "#e8ffd0", fontSize: "0.78rem", lineHeight: 1.4 }}>
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

            {/* New-index row: ingest a single player → cr-bg-<tag> */}
            <Box
              className="game-panel"
              sx={{
                mb: 3,
                p: { xs: 2, md: 2.5 },
                border: "1px dashed rgba(110,200,50,0.4)",
              }}
            >
              <Typography sx={{ color: "#80b848", fontSize: "0.78rem", mb: 1 }}>
                New index — crawl a player 3 layers deep →{" "}
                <code style={{ color: "#cef870" }}>cr-bg-&lt;tag&gt;</code>
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                <TextField
                  value={graphTag}
                  onChange={(e) => setGraphTag(e.target.value)}
                  placeholder="Player tag (e.g. P92LLUR8)"
                  size="small"
                  disabled={ingesting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !ingesting) runIngest(graphTag, "tag");
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    "& .MuiOutlinedInput-root": { color: "#e8ffd0" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(110,200,50,0.4)",
                    },
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={ingesting && ingestKind === "tag" ? null : <Hub />}
                  onClick={() => runIngest(graphTag, "tag")}
                  disabled={ingesting}
                  sx={{ background: "#a0e840", color: "#0a1a06", fontWeight: 800 }}
                >
                  {ingesting && ingestKind === "tag" ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: "#0a1a06" }} />
                      Crawling…
                    </Box>
                  ) : (
                    "Ingest"
                  )}
                </Button>
              </Box>
            </Box>
          </>
        )}

        {/* ─────────────── Tab 1: Ingestion History ─────────────── */}
        {tab === 1 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Button
                size="small"
                onClick={clearHistory}
                disabled={history.length === 0}
                sx={{ color: "#ff9a9a", textTransform: "none", fontSize: "0.75rem" }}
              >
                Clear history
              </Button>
            </Box>

            {history.length === 0 && (
              <Typography sx={{ textAlign: "center", color: "#80b848", mt: 4 }}>
                No ingestions yet. Run one from the Vector Indexes tab.
              </Typography>
            )}

            {history.map((h, i) => (
              <Box key={`${h.ts}-${i}`} className="game-panel" sx={{ mb: 2, p: { xs: 2, md: 2.5 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Typography sx={{ color: "#cef870", fontWeight: 900 }}>
                    {h.rootTag}{" "}
                    <Box component="span" sx={{ color: "#80b848", fontWeight: 600, fontSize: "0.85rem" }}>
                      → <code>{h.index}</code>
                    </Box>
                  </Typography>
                  <Typography sx={{ color: "#80b848", fontSize: "0.75rem" }}>
                    {new Date(h.ts).toLocaleString()}
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  {[
                    { label: "Seeds", value: h.seeds },
                    { label: "Players Crawled", value: h.playersCrawled },
                    { label: "Battles Scanned", value: h.battlesScanned },
                    { label: "Unique Matchups", value: h.uniqueMatchups },
                    { label: "Vectors Upserted", value: h.upserted },
                  ].map((m) => (
                    <Grid size={{ xs: 6, md: 2.4 }} key={m.label}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{ color: "#cef870", fontWeight: 900, fontSize: "1.3rem" }}>
                          {(m.value ?? 0).toLocaleString()}
                        </Typography>
                        <Typography className="game-section-label" sx={{ justifyContent: "center" }}>
                          {m.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </>
        )}

        {sampleError && (
          <Typography color="error" sx={{ textAlign: "center", mt: 2, fontFamily: "monospace" }}>
            {sampleError}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
