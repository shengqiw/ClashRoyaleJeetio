"use client";
import { Box } from "@mui/material";
import { useState } from "react";
import { useCardCatalog } from "./useCardIcons";
import { buildDeckLink } from "./deckLink";

type CopyDeckButtonProps = {
  /** The 8 card names of the deck to copy. */
  names: string[] | undefined | null;
  /** Extra class (e.g. "copy-deck-btn-lg" for the meta-lab hero deck). */
  className?: string;
  /** Pre-built link — skips catalog resolution (backend-supplied copyLink). */
  href?: string | null;
};

/**
 * "COPY" pill that puts a Clash Royale deck-copy deep link on the clipboard AND
 * opens it, so one click works on both desktop (link in clipboard, tab opens
 * the deep-link handler) and mobile (opens the game directly).
 *
 * Renders nothing when the deck can't be turned into a link — an incomplete
 * deck, an unknown card name, or the card catalog still loading. That's
 * deliberate: a dead COPY button is worse than no button.
 */
export function CopyDeckButton({ names, className, href }: CopyDeckButtonProps) {
  const { ids } = useCardCatalog();
  const [copied, setCopied] = useState(false);

  const link = href || buildDeckLink(names, ids);
  if (!link) return null;

  function handleClick() {
    const url = link as string;
    // Clipboard can reject (insecure context, denied permission) — the window
    // open below is the real payload, so never let a rejection surface.
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={handleClick}
      className={`copy-deck-btn${className ? ` ${className}` : ""}`}
      title="open in Clash Royale"
      aria-label="Copy deck — open in Clash Royale"
    >
      <span className="copy-deck-btn-label">{copied ? "COPIED" : "COPY"}</span>
      <span className="copy-deck-btn-hint">open in Clash Royale</span>
    </Box>
  );
}
