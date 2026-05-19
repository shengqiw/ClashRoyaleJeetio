/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  // Allow scripts from same origin; unsafe-eval is required by Emotion (MUI) and framer-motion
  `script-src 'self' 'unsafe-eval' 'unsafe-inline'`,
  // Emotion injects styles at runtime — unsafe-inline is unavoidable without a nonce setup
  `style-src 'self' 'unsafe-inline'`,
  // Next.js Image, SVG data URIs, blob URLs
  `img-src 'self' data: blob:`,
  // Geist fonts are self-hosted by Next.js under /_next/static/
  `font-src 'self' data:`,
  // API routes + HMR websocket in dev
  `connect-src 'self' ${isDev ? "ws://localhost:* wss://localhost:*" : ""}`.trim(),
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
