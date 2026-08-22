"use client";

import { useState } from "react";
import type { Clan } from "@/types/Clan";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

/**
 * AI Coach panel — posts the already-loaded clan JSON to /api/analyze.
 * No extra Clash Royale API calls happen here; the LLM chain is free-tier.
 *
 * The trace id from the response is rendered next to the answer (and next to any
 * error). That string is the join key: `grep <trace>` in the server log shows the
 * [api] line and every [llm] provider attempt for exactly this click.
 */
export const AiCoach = ({ clan }: { clan: Clan }) => {
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState<"fast" | "deep">("fast");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setMeta(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: clan, question: question || undefined, depth }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`${json.error || `HTTP ${res.status}`}${json.trace ? ` (trace ${json.trace})` : ""}`);
      setAnalysis(json.analysis);
      setMeta(`${json.provider}/${json.model} · ${(json.ms / 1000).toFixed(1)}s · trace ${json.trace}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something broke — try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mt={4} mb={6} textAlign="center">
      <Typography variant="h4" className="gold-shadow" mb={2}>
        AI Coach
      </Typography>
      <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap" mb={2}>
        <TextField
          placeholder="Ask about the clan… (optional)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          size="small"
          sx={{ minWidth: 300, bgcolor: "rgba(255,255,255,0.9)", borderRadius: 1 }}
        />
        <ToggleButtonGroup
          value={depth}
          exclusive
          size="small"
          onChange={(_, v) => v && setDepth(v)}
          sx={{ bgcolor: "rgba(255,255,255,0.9)", borderRadius: 1 }}
        >
          <ToggleButton value="fast">Fast</ToggleButton>
          <ToggleButton value="deep">Deep think</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" onClick={ask} disabled={loading}>
          {loading ? <CircularProgress size={22} /> : "Ask the coach"}
        </Button>
      </Box>
      {loading && depth === "deep" && (
        <Typography variant="caption" className="gold">
          Deep think uses a free reasoning model — can take a minute…
        </Typography>
      )}
      {error && (
        <Typography color="error" mt={2}>
          {error}
        </Typography>
      )}
      {analysis && (
        <Box
          mt={2}
          mx="auto"
          maxWidth={720}
          p={3}
          textAlign="left"
          sx={{ bgcolor: "rgba(0,0,0,0.55)", borderRadius: 2 }}
        >
          <Typography className="gold" whiteSpace="pre-wrap">
            {analysis}
          </Typography>
          {meta && (
            <Typography variant="caption" sx={{ opacity: 0.6 }} display="block" mt={1}>
              {meta}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
