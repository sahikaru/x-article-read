import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      { hostname: "unavatar.io" },
      { hostname: "pbs.twimg.com" },
      { hostname: "abs.twimg.com" },
    ],
  },
};

export default nextConfig;
