import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Served at /manifest.webmanifest and auto-linked from <head> by Next.
// This is what makes Android offer "Install app" and iOS "Add to Home Screen"
// open the site full-screen instead of in a Safari tab.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Jeetio",
    description: SITE_DESCRIPTION,
    id: "/",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#242741",
    theme_color: "#c293f8",
    categories: ["games", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Deck AI", url: "/deckai", description: "Counter any deck" },
      { name: "Stats", url: "/stats", description: "Player and clan lookup" },
    ],
  };
}
