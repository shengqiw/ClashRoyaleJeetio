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
  /** Tower troop name, when the deck data carries one (member page, battlelog). */
  towerTroop?: string | null;
};

/**
 * "COPY" pill that opens a Clash Royale deck-copy deep link and puts it on the
 * clipboard. It's a real <a> — not window.open — because native anchor
 * navigation is what mobile OSes reliably route through the app-link handler:
 * on a phone the tap opens Clash Royale with the deck import prompt (this is
 * how RoyaleAPI's copy buttons work), on desktop it opens Supercell's link
 * page in a new tab and the URL is on the clipboard for the phone.
 *
 * Renders nothing when the deck can't be turned into a link — an incomplete
 * deck, an unknown card name, or the card catalog still loading. That's
 * deliberate: a dead COPY button is worse than no button.
 */
export function CopyDeckButton({ names, className, href, towerTroop }: CopyDeckButtonProps) {
  const { ids } = useCardCatalog();
  const [copied, setCopied] = useState(false);

  const link = href || buildDeckLink(names, ids, towerTroop);
  if (!link) return null;

  function handleClick() {
    // Clipboard can reject (insecure context, denied permission) — the anchor
    // navigation is the real payload, so never let a rejection surface.
    navigator.clipboard?.writeText(link as string).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Box
      component="a"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
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
