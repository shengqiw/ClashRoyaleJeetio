"use client";
import { useEffect, useState } from "react";

type CardIconMap = Record<string, string>;

// Shape of each card returned by the backend /clash/cards endpoint.
type ApiCard = {
  name: string;
  iconUrls?: { medium?: string; evolutionMedium?: string };
};

// Fetched once per page load and shared across all hook consumers.
let cachePromise: Promise<CardIconMap> | null = null;

async function loadCardIcons(): Promise<CardIconMap> {
  const res = await fetch("/api/cards");
  if (!res.ok) throw new Error(`Failed to load cards: HTTP ${res.status}`);
  const data = await res.json();
  const cards: ApiCard[] = [
    ...(data?.items ?? []),
    ...(data?.supportItems ?? []),
  ];
  const map: CardIconMap = {};
  for (const card of cards) {
    const url = card.iconUrls?.medium;
    if (card.name && url) map[card.name] = url;
  }
  return map;
}

/**
 * Returns a map of card name -> medium icon URL, fetched once from /api/cards.
 * Use `icons[cardName]` to get an image src (may be undefined until loaded
 * or if a name has no match).
 */
export function useCardIcons(): CardIconMap {
  const [icons, setIcons] = useState<CardIconMap>({});

  useEffect(() => {
    let active = true;
    if (!cachePromise) cachePromise = loadCardIcons();
    cachePromise
      .then((map) => {
        if (active) setIcons(map);
      })
      .catch(() => {
        // On failure, reset so a later mount can retry; leave icons empty.
        cachePromise = null;
      });
    return () => {
      active = false;
    };
  }, []);

  return icons;
}
