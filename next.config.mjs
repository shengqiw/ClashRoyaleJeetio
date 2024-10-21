/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  output: "standalone",
  // Explicitly set environment variables
  env: {
    API_URL: process.env.API_URL,
  },
};

export default nextConfig;
