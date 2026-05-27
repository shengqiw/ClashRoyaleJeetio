"use client";
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Person } from "@mui/icons-material";
import { useState } from "react";
import "./deckai.css";

type OppCard = {
  card: string;
  appearances: number;
  lossRate: string;
};

type AnalysisData = {
  tag: string;
  battlesScanned: number;
  losses: number;
  biggestOpps: OppCard[];
  analysis: string | null;
};

export default function DeckAIPage() {
  const [tagInput, setTagInput] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSearch() {
    const raw = tagInput.trim();
    if (!raw) return;
    const tag = raw.startsWith("#") ? raw : `#${raw}`;
    setTagInput("");
    setErrorMessage("");
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/biggest-opps/${encodeURIComponent(tag)}`
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          payload?.message || payload?.reason || `HTTP ${res.status}`
        );
      }
      const json: AnalysisData = await res.json();
      setData(json);
      setActiveTag(tag);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const maxAppearances = data?.biggestOpps?.[0]?.appearances ?? 1;

  return (
    <Box className="deckai-bg">
      {/* ── Header ── */}
      <Box className="deckai-header">
        <Typography className="deckai-title">Deck AI</Typography>
        <Typography className="deckai-subtitle">
          {activeTag
            ? `Analyzing: ${activeTag}`
            : "Scan your losses · find your kryptonite"}
        </Typography>
      </Box>

      <Container maxWidth="md">
        {/* ── Search controls ── */}
        <Box className="deckai-controls">
          <Box className="deckai-input-row">
            <Person sx={{ color: "#94A3B8", fontSize: 20, flexShrink: 0 }} />
            <TextField
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Player tag (e.g. #ABC123)"
              size="small"
              className="deckai-tag-field"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              className="deckai-btn-analyze"
              onClick={handleSearch}
              disabled={loading}
            >
              Analyze
            </Button>
          </Box>
        </Box>

        {/* ── Loading ── */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress sx={{ color: "#3B82F6" }} />
          </Box>
        )}

        {/* ── Error ── */}
        {errorMessage && !loading && (
          <Typography
            color="error"
            sx={{ mt: 4, textAlign: "center", fontFamily: "monospace" }}
          >
            {errorMessage}
          </Typography>
        )}

        {/* ── Results ── */}
        {data && !loading && (
          <>
            {/* Summary */}
            <Typography className="deckai-summary-bar" sx={{ mb: 2.5 }}>
              {data.battlesScanned} battles scanned · {data.losses} losses
            </Typography>

            {/* AI Analysis */}
            {data.analysis && (
              <Box className="deckai-analysis-card">
                <Typography className="deckai-analysis-label">
                  🤖 AI Analysis
                </Typography>
                <Typography className="deckai-analysis-body">
                  {data.analysis}
                </Typography>
              </Box>
            )}

            {/* Opp card list */}
            {data.biggestOpps.length > 0 ? (
              <>
                <Typography className="deckai-section-heading" sx={{ mt: 0.5 }}>
                  Biggest Opponents ({data.biggestOpps.length} cards)
                </Typography>
                <Box className="deckai-opp-list">
                  {data.biggestOpps.map((item, i) => (
                    <Box key={item.card} className="deckai-opp-row">
                      {/* Rank */}
                      <Box className="deckai-opp-rank">#{i + 1}</Box>

                      {/* Card info + bar */}
                      <Box className="deckai-opp-info">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Typography className="deckai-opp-name">
                            {item.card}
                          </Typography>
                          <Chip
                            label={item.lossRate + " losses"}
                            size="small"
                            className="deckai-loss-chip"
                          />
                        </Box>
                        {/* Frequency bar */}
                        <Box className="deckai-bar-track">
                          <Box
                            className="deckai-bar-fill"
                            sx={{
                              width: `${(item.appearances / maxAppearances) * 100}%`,
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Typography
                sx={{
                  color: "#94A3B8",
                  textAlign: "center",
                  mt: 4,
                  fontStyle: "italic",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                }}
              >
                No losses in recent battles — you&apos;re built different 💪
              </Typography>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
