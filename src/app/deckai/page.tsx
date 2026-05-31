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
import { useEffect, useRef, useState } from "react";
import { useCardIcons } from "../../lib/useCardIcons";
import "./deckai.css";

/**
 * Consume a Server-Sent Events stream via fetch (so we control the request
 * lifecycle and can abort it). Calls `onEvent(eventName, dataString)` for each
 * complete `event:`/`data:` frame.
 */
async function consumeSSE(
  url: string,
  onEvent: (event: string, data: string) => void,
  signal?: AbortSignal
) {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "text/event-stream" },
  });
  if (!res.ok || !res.body) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message || payload?.error || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      onEvent(event, data);
    }
  }
}

const RECENT_TAGS_KEY = "deckai:recentTags";
const RECENT_TAGS_MAX = 5;

function loadRecentTags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function pushRecentTag(prev: string[], tag: string): string[] {
  const next = [tag, ...prev.filter((t) => t !== tag)].slice(0, RECENT_TAGS_MAX);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RECENT_TAGS_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable / quota — ignore
    }
  }
  return next;
}

type OppCard = {
  card: string;
  appearances: number;
  lossRate: string;
};

type OppsData = {
  tag: string;
  battlesScanned: number;
  losses: number;
  biggestOpps: OppCard[];
};

type DeckSuggestion = {
  tier: "low" | "medium" | "high" | string;
  avgElixir: number;
  cards: string[];
  reason: string;
};

const DECK_TIER_LABELS: Record<string, string> = {
  low: "Low Elixir · Fast Cycle",
  medium: "Medium Elixir · Balanced",
  high: "High Elixir · Beatdown",
};

type BattleCard = {
  name: string;
  iconUrls?: { medium?: string };
};

type BattleSide = {
  name?: string;
  crowns: number;
  cards: BattleCard[];
};

type Battle = {
  battleTime: string;
  team: BattleSide[];
  opponent: BattleSide[];
};

export default function DeckAIPage() {
  const [tagInput, setTagInput] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [oppsData, setOppsData] = useState<OppsData | null>(null);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analysisStreaming, setAnalysisStreaming] = useState(false);
  const [deckSuggestions, setDeckSuggestions] = useState<DeckSuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const cardIcons = useCardIcons();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setRecentTags(loadRecentTags());
    return () => abortRef.current?.abort();
  }, []);

  async function runSearch(rawInput: string) {
    const raw = rawInput.trim();
    if (!raw) return;
    const tag = raw.startsWith("#") ? raw : `#${raw}`;

    // Cancel any search already in flight.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTagInput("");
    setErrorMessage("");
    setOppsData(null);
    setBattles([]);
    setAnalysis("");
    setAnalysisStreaming(false);
    setDeckSuggestions([]);
    setOppsLoading(true);
    setActiveTag(tag);
    setRecentTags((prev) => pushRecentTag(prev, tag));

    const encoded = encodeURIComponent(tag);

    // ── Battle log: independent — renders whenever it's ready ──
    fetch(`/api/battlelog/${encoded}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("battlelog"))))
      .then((log) => setBattles(Array.isArray(log) ? log.slice(0, 5) : []))
      .catch(() => {
        /* battlelog is supplementary — tolerate failure */
      });

    // ── Opps + AI analysis: streamed piece-by-piece over SSE ──
    try {
      await consumeSSE(
        `/api/biggest-opps/${encoded}?stream=true`,
        (event, payload) => {
          if (event === "opps") {
            setOppsData(JSON.parse(payload));
            setOppsLoading(false);
            setAnalysisStreaming(true);
          } else if (event === "analysis") {
            const { text } = JSON.parse(payload);
            if (text) setAnalysis((prev) => prev + text);
          } else if (event === "decks") {
            const { decks } = JSON.parse(payload);
            if (Array.isArray(decks)) setDeckSuggestions(decks);
          } else if (event === "done") {
            setAnalysisStreaming(false);
          } else if (event === "error") {
            const { message } = JSON.parse(payload);
            setErrorMessage(message || "AI analysis failed");
            setAnalysisStreaming(false);
          }
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMessage((err as Error).message);
      }
    } finally {
      if (abortRef.current === controller) {
        setOppsLoading(false);
        setAnalysisStreaming(false);
      }
    }
  }

  function handleSearch() {
    return runSearch(tagInput);
  }

  const busy = oppsLoading || analysisStreaming;
  const maxAppearances = oppsData?.biggestOpps?.[0]?.appearances ?? 1;

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
              disabled={busy}
            >
              Analyze
            </Button>
          </Box>

          {recentTags.length > 0 && (
            <Box className="deckai-recent-row">
              <Typography className="deckai-recent-label">Recent</Typography>
              {recentTags.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  className="deckai-recent-chip"
                  onClick={() => runSearch(t)}
                  disabled={busy}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* ── Loading (waiting for the first piece) ── */}
        {oppsLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress sx={{ color: "#3B82F6" }} />
          </Box>
        )}

        {/* ── Top-level error (nothing rendered yet) ── */}
        {errorMessage && !oppsData && !oppsLoading && (
          <Typography
            color="error"
            sx={{ mt: 4, textAlign: "center", fontFamily: "monospace" }}
          >
            {errorMessage}
          </Typography>
        )}

        {/* ── AI Analysis — streams in like a chat bot ── */}
        {oppsData && (
          <>
            {/* Summary */}
            <Typography className="deckai-summary-bar" sx={{ mb: 2.5 }}>
              {oppsData.battlesScanned} battles scanned · {oppsData.losses} losses
            </Typography>

            <Box className="deckai-analysis-card">
              <Box className="deckai-analysis-header">
                <Typography className="deckai-analysis-label">
                  🤖 AI Analysis
                </Typography>
                {analysisStreaming && (
                  <CircularProgress
                    size={14}
                    thickness={5}
                    className="deckai-analysis-spinner"
                  />
                )}
              </Box>

              {analysis || analysisStreaming ? (
                <Typography className="deckai-analysis-body">
                  {analysis}
                  {analysisStreaming && <span className="deckai-cursor" />}
                </Typography>
              ) : errorMessage ? (
                <Typography className="deckai-analysis-error">
                  {errorMessage}
                </Typography>
              ) : null}
            </Box>

            {/* AI-recommended counter decks — low / medium / high elixir */}
            {deckSuggestions.length > 0 && (
              <>
                <Typography className="deckai-section-heading">
                  AI Deck Picks — best decks to run vs your last 25 games
                </Typography>
                <Box className="deckai-deck-list">
                  {deckSuggestions.map((deck, i) => (
                    <Box key={deck.tier ?? i} className="deckai-deck-card">
                      <Box className="deckai-deck-head">
                        <Typography className="deckai-deck-tier">
                          {DECK_TIER_LABELS[deck.tier] ?? deck.tier}
                        </Typography>
                        {typeof deck.avgElixir === "number" && (
                          <Chip
                            label={`${deck.avgElixir.toFixed(1)} avg`}
                            size="small"
                            className="deckai-elixir-chip"
                          />
                        )}
                      </Box>
                      <Box className="deckai-deck-cards">
                        {deck.cards?.map((name, j) =>
                          cardIcons[name] ? (
                            <Box
                              component="img"
                              key={`${name}-${j}`}
                              src={cardIcons[name]}
                              alt={name}
                              title={name}
                              className="deckai-deck-card-img"
                            />
                          ) : (
                            <Box
                              key={`${name}-${j}`}
                              className="deckai-deck-card-fallback"
                              title={name}
                            >
                              {name}
                            </Box>
                          )
                        )}
                      </Box>
                      {deck.reason && (
                        <Typography className="deckai-deck-reason">
                          {deck.reason}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Opp card list */}
            {oppsData.biggestOpps.length > 0 ? (
              <>
                <Typography className="deckai-section-heading" sx={{ mt: 0.5 }}>
                  Losses from past 25 battles (loss rate playing against card)
                </Typography>
                <Box className="deckai-opp-grid">
                  {oppsData.biggestOpps.map((item, i) => (
                    <Box key={item.card} className="deckai-opp-tile">
                      {/* Rank */}
                      <Box className="deckai-opp-rank">#{i + 1}</Box>

                      {/* Card image */}
                      {cardIcons[item.card] && (
                        <Box
                          component="img"
                          src={cardIcons[item.card]}
                          alt={item.card}
                          className="deckai-opp-img"
                        />
                      )}

                      {/* Name + loss count */}
                      <Typography className="deckai-opp-name">
                        {item.card}
                      </Typography>
                      <Chip
                        label={item.lossRate}
                        size="small"
                        className="deckai-loss-chip"
                      />

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

        {/* ── Last matches — independent, renders whenever it's ready ── */}
        {battles.length > 0 && (
          <>
                <Typography className="deckai-section-heading" sx={{ mt: 3 }}>
                  Last {battles.length} Matches
                </Typography>
                <Box className="deckai-match-list">
                  {battles.map((b, i) => {
                    const me = b.team?.[0];
                    const opp = b.opponent?.[0];
                    const myCrowns = me?.crowns ?? 0;
                    const oppCrowns = opp?.crowns ?? 0;
                    const result =
                      myCrowns > oppCrowns
                        ? "win"
                        : myCrowns < oppCrowns
                        ? "loss"
                        : "draw";

                    const renderCards = (cards: BattleCard[]) =>
                      cards.map((c, j) => {
                        const src = c.iconUrls?.medium || cardIcons[c.name];
                        return src ? (
                          <Box
                            component="img"
                            key={j}
                            src={src}
                            alt={c.name}
                            className="deckai-match-card"
                          />
                        ) : null;
                      });

                    return (
                      <Box
                        key={i}
                        className={`deckai-match-row deckai-match-${result}`}
                      >
                        {/* Player */}
                        <Box className="deckai-match-side">
                          <Typography className="deckai-match-name">You</Typography>
                          <Box className="deckai-match-cards">
                            {renderCards(me?.cards ?? [])}
                          </Box>
                        </Box>

                        {/* Result */}
                        <Box className="deckai-match-result">
                          <Typography className="deckai-match-score">
                            {myCrowns}–{oppCrowns}
                          </Typography>
                          <Typography className="deckai-match-label">
                            {result.toUpperCase()}
                          </Typography>
                        </Box>

                        {/* Opponent */}
                        <Box className="deckai-match-side deckai-match-side-right">
                          <Typography className="deckai-match-name">
                            {opp?.name ?? "Opponent"}
                          </Typography>
                          <Box className="deckai-match-cards">
                            {renderCards(opp?.cards ?? [])}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
      </Container>
    </Box>
  );
}

