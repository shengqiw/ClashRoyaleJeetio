/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  // Allow scripts from same origin; unsafe-eval is required by Emotion (MUI) and framer-motion.
  // googletagmanager.com hosts the Google Analytics (gtag.js) script.
  `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com`,
  // Emotion injects styles at runtime — unsafe-inline is unavoidable without a nonce setup
  `style-src 'self' 'unsafe-inline'`,
  // Next.js Image, SVG data URIs, blob URLs, Clash Royale card/badge art CDN,
  // and the Google Analytics tracking pixel.
  `img-src 'self' data: blob: https://api-assets.clashroyale.com https://www.google-analytics.com`,
  // Geist fonts are self-hosted by Next.js under /_next/static/
  `font-src 'self' data:`,
  // API routes, Google Analytics collect beacons, + HMR websocket in dev
  `connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com ${isDev ? "ws://localhost:* wss://localhost:*" : ""}`.trim(),
  `default-src 'self'`,
  `frame-ancestors 'none'`,
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
