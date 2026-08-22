"use client";
import {
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { CardImage } from "../../lib/CardImage";
import { CardPicker } from "../../lib/CardPicker";
import { CopyDeckButton } from "../../lib/CopyDeckButton";
import { useCardIcons } from "../../lib/useCardIcons";
import { useStoredKey } from "../../lib/useStoredKey";
import { BAND_CHOICES, BAND_LABELS, type BandChoice, type TrophyBand } from "../../lib/deckIntel";
import "./meta-lab.css";

/** Passcode lives in the browser only — it never touches our server env. */
const KEY_STORAGE = "meta-lab:key";
const MAX_FOCUS_CARDS = 3;

type MetaSwap = { for: string; use: string; why: string };
type MetaEvidence = {
  winnerCards: string[];
  occurrences: number;
  avgCrownMargin: number;
  band: string;
};

type MetaDeckResult = {
  deck: string[];
  deckIds: Array<number | null> | null; // positional — null slots for unresolved names
  avgElixir: number;
  rationale: string;
  swaps: MetaSwap[];
  evidence: MetaEvidence[];
  copyLink: string | null;
  band: string;
  latest: boolean;
};

/** Band <select> labels — "auto" means "any band" for the generator. */
const BAND_LABELS_SHORT: Record<BandChoice, string> = {
  auto: "ANY",
  low: "LOW",
  mid: "MID",
  high: "HIGH",
  top: "TOP",
};

function bandDisplay(band: string): string {
  return BAND_LABELS[band as TrophyBand] ?? band.toUpperCase();
}

export default function MetaLabPage() {
  const [apiKey, setApiKey] = useStoredKey(KEY_STORAGE);
  const [keyInput, setKeyInput] = useState("");
  const [gateError, setGateError] = useState("");
  const [shake, setShake] = useState(false);

  const [band, setBand] = useState<BandChoice>("auto");
  const [latest, setLatest] = useState(true);
  const [focusCards, setFocusCards] = useState<string[]>([]);

  const [result, setResult] = useState<MetaDeckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState<string | false>(false);

  const cardIcons = useCardIcons();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /** Wrong passcode: shake the gate, drop the stored key, ask again. */
  function rejectKey(message: string) {
    setApiKey("");
    setKeyInput("");
    setResult(null);
    setGateError(message);
    // Only shake on a rejection — "forget passcode" passes no message.
    if (message) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  function submitKey() {
    const key = keyInput.trim();
    if (!key) return;
    setApiKey(key);
    setGateError("");
  }

  async function generate() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setNotConfigured(false);
    setResult(null);
    try {
      const res = await fetch("/api/meta-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-premium-key": apiKey,
        },
        body: JSON.stringify({
          band: band === "auto" ? undefined : band,
          latest,
          focusCards: focusCards.length > 0 ? focusCards : undefined,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        rejectKey("invalid key");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        // 503 also covers "no intel ingested yet" / "no decks for this band" —
        // show the backend's own reason instead of claiming it's unconfigured.
        setNotConfigured(String(data?.error || "not configured on the backend yet"));
        return;
      }
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      setResult(data as MetaDeckResult);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  // ── Gate ──────────────────────────────────────────────────────────────
  // `apiKey` comes straight from localStorage via useSyncExternalStore, so a
  // returning key-holder never sees the form (React re-reads the store before
  // paint after hydration).
  if (!apiKey) {
    return (
      <Box className="metalab-bg">
        <Container maxWidth="sm">
          <Box className={`metalab-gate${shake ? " metalab-shake" : ""}`}>
            <Typography className="metalab-crown">👑</Typography>
            <Typography className="metalab-title">Meta Lab</Typography>
            <Typography className="metalab-tagline">
              the p2w edge, earned with data
            </Typography>
            <Typography className="metalab-gate-label">Passcode</Typography>
            <TextField
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitKey()}
              type="password"
              size="small"
              placeholder="••••••••"
              className="metalab-field metalab-gate-field"
              autoComplete="off"
            />
            <Button className="metalab-btn" onClick={submitKey} disabled={!keyInput.trim()}>
              Enter
            </Button>
            {gateError && (
              <Typography className="metalab-gate-error">{gateError}</Typography>
            )}
          </Box>
        </Container>
      </Box>
    );
  }

  // ── Lab ───────────────────────────────────────────────────────────────
  return (
    <Box className="metalab-bg">
      <Box className="metalab-header">
        <Typography className="metalab-title">
          Meta Lab <span className="metalab-crown-inline">👑</span>
        </Typography>
        <Typography className="metalab-tagline">
          the p2w edge, earned with data
        </Typography>
      </Box>

      <Container maxWidth="md">
        {/* ── Controls ── */}
        <Box className="metalab-controls">
          <Box className="metalab-control-row">
            <Box className="metalab-control">
              <Typography className="metalab-label">Band</Typography>
              <Select
                value={band}
                onChange={(e) => setBand(e.target.value as BandChoice)}
                size="small"
                className="metalab-select"
                disabled={loading}
              >
                {BAND_CHOICES.map((b) => (
                  <MenuItem key={b} value={b} className="metalab-menu-item">
                    {BAND_LABELS_SHORT[b]}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box className="metalab-control">
              <Typography className="metalab-label">Bias to latest cards</Typography>
              <Switch
                checked={latest}
                onChange={(e) => setLatest(e.target.checked)}
                disabled={loading}
                className="metalab-switch"
              />
            </Box>

            <Button className="metalab-btn" onClick={generate} disabled={loading}>
              {loading ? "Brewing…" : "Generate"}
            </Button>
          </Box>

          <Box className="metalab-control-block">
            <Typography className="metalab-label">
              Focus cards — optional, up to {MAX_FOCUS_CARDS}
            </Typography>
            <CardPicker
              value={focusCards}
              onChange={setFocusCards}
              max={MAX_FOCUS_CARDS}
              placeholder="Build around…"
              fieldClassName="metalab-field"
              disabled={loading}
            />
          </Box>

          <Button className="metalab-forget" onClick={() => rejectKey("")}>
            forget passcode
          </Button>
        </Box>

        {/* ── States ── */}
        {notConfigured && (
          <Typography className="metalab-note">
            Meta Lab: {notConfigured} — nothing to brew.
          </Typography>
        )}

        {error && !loading && (
          <Typography className="metalab-error">{error}</Typography>
        )}

        {loading && (
          <Box className="metalab-skeleton">
            <Box className="metalab-skel metalab-skel-head" />
            <Box className="metalab-skel-deck">
              {Array.from({ length: 8 }).map((_, i) => (
                <Box key={i} className="metalab-skel metalab-skel-card" />
              ))}
            </Box>
            <Box className="metalab-skel metalab-skel-line" />
            <Box className="metalab-skel metalab-skel-line metalab-skel-line-short" />
            <Box className="metalab-skel metalab-skel-line" />
          </Box>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <>
            {/* Hero deck */}
            <Box className="metalab-hero">
              <Box className="metalab-hero-head">
                <Box className="metalab-hero-chips">
                  <Chip
                    label={bandDisplay(result.band)}
                    size="small"
                    className="metalab-chip"
                  />
                  {result.avgElixir != null && (
                    <Chip
                      label={`${Number(result.avgElixir).toFixed(1)} avg elixir`}
                      size="small"
                      className="metalab-chip"
                    />
                  )}
                  {result.latest && (
                    <Chip label="LATEST CARDS" size="small" className="metalab-chip" />
                  )}
                </Box>
                <CopyDeckButton
                  names={result.deck}
                  href={result.copyLink}
                  className="copy-deck-btn-lg"
                />
              </Box>

              <Box className="metalab-hero-deck">
                {result.deck.map((name, i) => (
                  <Box key={`${name}-${i}`} className="metalab-hero-card">
                    <CardImage
                      icons={cardIcons}
                      name={name}
                      className="metalab-hero-card-img"
                    />
                    <Typography className="metalab-hero-card-name">{name}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Rationale */}
            {result.rationale && (
              <>
                <Typography className="metalab-section">Why this deck</Typography>
                <Box className="metalab-panel">
                  <Typography className="metalab-body">{result.rationale}</Typography>
                </Box>
              </>
            )}

            {/* Swaps */}
            {result.swaps?.length > 0 && (
              <>
                <Typography className="metalab-section">
                  Swaps if you&apos;re short
                </Typography>
                <Box className="metalab-panel">
                  {result.swaps.map((s, i) => (
                    <Box key={i} className="metalab-swap">
                      <Box className="metalab-swap-line">
                        <span className="metalab-swap-out">{s.for}</span>
                        <span className="metalab-swap-sep">→</span>
                        <span className="metalab-swap-in">{s.use}</span>
                      </Box>
                      {s.why && (
                        <Typography className="metalab-swap-why">{s.why}</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Evidence */}
            {result.evidence?.length > 0 && (
              <>
                <Typography className="metalab-section">
                  Evidence — real wins behind the pick
                </Typography>
                <Box className="metalab-evidence-list">
                  {result.evidence.map((e, i) => (
                    <Box key={i} className="metalab-evidence">
                      <Box className="metalab-evidence-head">
                        {/* The contract gives us the WINNING deck, its win
                            count and crown margin — not the loser's list — so
                            the row states what this deck did, not who it beat. */}
                        <Typography className="metalab-evidence-stat">
                          won {e.occurrences}× · {e.avgCrownMargin > 0 ? "+" : ""}
                          {e.avgCrownMargin} crowns · {bandDisplay(e.band)}
                        </Typography>
                        <CopyDeckButton names={e.winnerCards} />
                      </Box>
                      <Box className="metalab-evidence-cards">
                        {(e.winnerCards ?? []).map((name, j) => (
                          <CardImage
                            key={`${name}-${j}`}
                            icons={cardIcons}
                            name={name}
                            className="metalab-evidence-card-img"
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
