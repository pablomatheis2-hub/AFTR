import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aftr/shared", "@aftr/supabase"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
