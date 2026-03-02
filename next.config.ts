import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor mobile build
  // Use: NEXT_PUBLIC_BUILD_TARGET=mobile next build
  ...(process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" && {
    output: "export",
    trailingSlash: true,
  }),
};

export default nextConfig;
