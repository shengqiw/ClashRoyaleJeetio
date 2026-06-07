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
import { useCardIcons, resolveCardIcon } from "../../lib/useCardIcons";
import { CardImage } from "../../lib/CardImage";
import { renderInlineMarkdown } from "../../lib/inlineMarkdown";
import { fetchDeckCounters, type DeckCounter } from "../../lib/deckIntel";
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

type DeckOptSuggestion = {
  deck: string[];
  avgElixir: number | null;
  shared: number;
  swaps: number;
  remove: string[];
  add: string[];
  winCount: number;
  avgCrownMargin: number;
};

type DeckOptimization = {
  yourDeck: string[];
  suggestions: DeckOptSuggestion[];
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
  type?: string;
  arena?: { name?: string };
  team: BattleSide[];
  opponent: BattleSide[];
};

/**
 * The CR API stamps battles as a compact ISO-ish string ("20260531T120000.000Z")
 * that `Date` can't parse directly — split it into UTC components by hand.
 */
function parseBattleTime(bt?: string): Date | null {
  if (!bt) return null;
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(bt);
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }
  const fallback = new Date(bt);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Short relative timestamp ("5m ago", "3h ago", "Mar 12"). */
function formatBattleTime(bt?: string): string {
  const date = parseBattleTime(bt);
  if (!date) return "";
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Human-friendly game type from the arena, e.g. "Legendary_Arena" → "Legendary Arena". */
function gameTypeLabel(b: Battle): string {
  return (b.arena?.name || b.type || "").replace(/_/g, " ");
}

export default function DeckAIPage() {
  const [tagInput, setTagInput] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [oppsData, setOppsData] = useState<OppsData | null>(null);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analysisStreaming, setAnalysisStreaming] = useState(false);
  const [deckSuggestions, setDeckSuggestions] = useState<DeckSuggestion[]>([]);
  const [deckOpt, setDeckOpt] = useState<DeckOptimization | null>(null);
  const [metaCounters, setMetaCounters] = useState<DeckCounter[]>([]);
  const [countersLoading, setCountersLoading] = useState(false);
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
    setDeckOpt(null);
    setMetaCounters([]);
    setCountersLoading(false);
    setOppsLoading(true);
    setActiveTag(tag);
    setRecentTags((prev) => pushRecentTag(prev, tag));

    const encoded = encodeURIComponent(tag);

    // ── Battle log: independent — renders whenever it's ready ──
    fetch(`/api/battlelog/${encoded}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("battlelog"))))
      .then((log) => setBattles(Array.isArray(log) ? log.slice(0, 10) : []))
      .catch(() => {
        /* battlelog is supplementary — tolerate failure */
      });

    // ── Opps + AI analysis: streamed piece-by-piece over SSE ──
    try {
      await consumeSSE(
        `/api/biggest-opps/${encoded}?stream=true`,
        (event, payload) => {
          if (event === "opps") {
            const data: OppsData = JSON.parse(payload);
            setOppsData(data);
            setOppsLoading(false);
            setAnalysisStreaming(true);

            // Fire a deck-intel lookup from the biggest opponent cards — what
            // the top 50 players beat similar decks with. Supplementary, so
            // failures are swallowed and it never blocks the AI analysis.
            const oppCards = (data.biggestOpps || []).map((o) => o.card);
            if (oppCards.length > 0) {
              setCountersLoading(true);
              fetchDeckCounters(oppCards, tag, controller.signal)
                .then((counters) => setMetaCounters(counters))
                .catch(() => {
                  /* meta intel is optional — ignore (incl. AbortError) */
                })
                .finally(() => setCountersLoading(false));
            }
          } else if (event === "analysis") {
            const { text } = JSON.parse(payload);
            if (text) setAnalysis((prev) => prev + text);
          } else if (event === "decks") {
            const { decks } = JSON.parse(payload);
            if (Array.isArray(decks)) setDeckSuggestions(decks);
          } else if (event === "deck-optimization") {
            const data: DeckOptimization = JSON.parse(payload);
            if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
              setDeckOpt(data);
            }
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
                  {renderInlineMarkdown(analysis)}
                  {analysisStreaming && <span className="deckai-cursor" />}
                </Typography>
              ) : errorMessage ? (
                <Typography className="deckai-analysis-error">
                  {errorMessage}
                </Typography>
              ) : null}
            </Box>

            {/* Optimized Deck — the player's own deck, tuned by swapping 1–4
                cards toward a similar high-win-rate meta deck. Single "best"
                suggestion, shown right under the AI analysis. */}
            {deckOpt && deckOpt.suggestions.length > 0 && (() => {
              const s = deckOpt.suggestions[0];
              const removeSet = new Set(s.remove);
              const addSet = new Set(s.add);

              const renderCard = (name: string, j: number, mark: string) => {
                const src = resolveCardIcon(cardIcons, name);
                const cls = mark ? ` ${mark}` : "";
                return src ? (
                  <CardImage
                    key={`${name}-${j}`}
                    icons={cardIcons}
                    name={name}
                    title={name}
                    className={`deckai-deck-card-img${cls}`}
                  />
                ) : (
                  <Box
                    key={`${name}-${j}`}
                    className={`deckai-deck-card-fallback${cls}`}
                    title={name}
                  >
                    {name}
                  </Box>
                );
              };

              return (
                <>
                  <Typography className="deckai-section-heading">
                    Optimized Deck — tune what you already run
                  </Typography>
                  <Box className="deckai-deck-list">
                    <Box className="deckai-deck-card deckai-optimized-card">
                      <Box className="deckai-deck-head">
                        <Typography className="deckai-deck-tier">
                          Keep {s.shared}/8 · swap {s.swaps} card
                          {s.swaps > 1 ? "s" : ""}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                          <Chip
                            label={`won ${s.winCount.toLocaleString()}×`}
                            size="small"
                            className="deckai-elixir-chip"
                          />
                          {s.avgCrownMargin > 0 && (
                            <Chip
                              label={`+${s.avgCrownMargin} crowns`}
                              size="small"
                              className="deckai-elixir-chip"
                            />
                          )}
                          {typeof s.avgElixir === "number" && (
                            <Chip
                              label={`${s.avgElixir.toFixed(1)} avg`}
                              size="small"
                              className="deckai-elixir-chip"
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Current deck — cards leaving are ringed red */}
                      <Typography className="deckai-deck-rowlabel">
                        Your deck now
                      </Typography>
                      <Box className="deckai-deck-cards">
                        {deckOpt.yourDeck.map((name, j) =>
                          renderCard(
                            name,
                            j,
                            removeSet.has(name) ? "deckai-card-removed" : ""
                          )
                        )}
                      </Box>

                      <Box className="deckai-swap-list">
                        {s.remove.map((out, j) => (
                          <Box key={`${out}-${j}`} className="deckai-swap-line">
                            <span className="deckai-swap-out-text">{out}</span>
                            <span className="deckai-swap-sep">→</span>
                            <span className="deckai-swap-in-text">
                              {s.add[j] ?? "?"}
                            </span>
                          </Box>
                        ))}
                      </Box>

                      {/* Optimized deck — new cards ringed green */}
                      <Typography className="deckai-deck-rowlabel">
                        Optimized
                      </Typography>
                      <Box className="deckai-deck-cards">
                        {s.deck.map((name, j) =>
                          renderCard(
                            name,
                            j,
                            addSet.has(name) ? "deckai-card-added" : ""
                          )
                        )}
                      </Box>
                    </Box>
                  </Box>
                </>
              );
            })()}

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
                        {deck.cards?.map((name, j) => {
                          const src = resolveCardIcon(cardIcons, name);
                          return src ? (
                            <CardImage
                              key={`${name}-${j}`}
                              icons={cardIcons}
                              name={name}
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
                          );
                        })}
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

            {/* Meta counters — real decks the top 50 USA beat this archetype with */}
            {(countersLoading || metaCounters.length > 0) && (
              <>
                <Typography className="deckai-section-heading">
                  Top ranked decks that beat your biggest counters
                </Typography>
                {countersLoading && metaCounters.length === 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                    <CircularProgress size={20} sx={{ color: "#3B82F6" }} />
                  </Box>
                ) : (
                  <Box className="deckai-deck-list">
                    {metaCounters.slice(0, 3).map((c, i) => (
                      <Box key={i} className="deckai-deck-card">
                        <Box className="deckai-deck-head">
                          <Typography className="deckai-deck-tier">
                            Won {c.occurrences ?? 1}× among top players
                          </Typography>
                          {typeof c.winnerAvgElixir === "number" && (
                            <Chip
                              label={`${c.winnerAvgElixir.toFixed(1)} avg`}
                              size="small"
                              className="deckai-elixir-chip"
                            />
                          )}
                        </Box>
                        <Box className="deckai-deck-cards">
                          {c.winnerCards.map((name, j) => {
                            // Stored names may carry an "Evo " prefix; the
                            // resolver normalizes that (and other variants).
                            const src = resolveCardIcon(cardIcons, name);
                            return src ? (
                              <CardImage
                                key={`${name}-${j}`}
                                icons={cardIcons}
                                name={name}
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
                            );
                          })}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
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
                      <CardImage
                        icons={cardIcons}
                        name={item.card}
                        className="deckai-opp-img"
                      />

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
                        const src = c.iconUrls?.medium || resolveCardIcon(cardIcons, c.name);
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
                          {gameTypeLabel(b) && (
                            <Typography className="deckai-match-mode">
                              {gameTypeLabel(b)}
                            </Typography>
                          )}
                          <Typography className="deckai-match-score">
                            {myCrowns}–{oppCrowns}
                          </Typography>
                          <Typography className="deckai-match-label">
                            {result.toUpperCase()}
                          </Typography>
                          {formatBattleTime(b.battleTime) && (
                            <Typography className="deckai-match-time">
                              {formatBattleTime(b.battleTime)}
                            </Typography>
                          )}
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

