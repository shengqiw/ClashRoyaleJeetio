"use client";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import {
  resolveCardIcon,
  resolveBaseCardIcon,
  type CardIconMap,
} from "./useCardIcons";

type CardImageProps = {
  icons: CardIconMap;
  name: string;
  className?: string;
  alt?: string;
  title?: string;
};

/**
 * Renders a card icon, preferring the evolution art when the name asks for it.
 * Some newer evo cards ship a broken `evolutionMedium` URL that 404s — we can't
 * know which without loading them, so we let the browser try and fall back to
 * the base medium art via the <img> `onError` event. Returns null when no icon
 * resolves at all (caller renders its own text fallback).
 */
export function CardImage({ icons, name, className, alt, title }: CardImageProps) {
  const primary = resolveCardIcon(icons, name);
  const fallback = resolveBaseCardIcon(icons, name);
  const [failed, setFailed] = useState(false);

  // Reset when the resolved icon changes (icons load async / name changes).
  useEffect(() => {
    setFailed(false);
  }, [primary]);

  const src = failed && fallback ? fallback : primary;
  if (!src) return null;

  return (
    <Box
      component="img"
      src={src}
      alt={alt ?? name}
      title={title ?? name}
      className={className}
      onError={() => {
        // Swap to base art once, only if it's a different (untried) URL.
        if (!failed && fallback && fallback !== primary) setFailed(true);
      }}
    />
  );
}
