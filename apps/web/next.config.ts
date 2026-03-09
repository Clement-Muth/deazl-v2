import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    swcPlugins: [["@lingui/swc-plugin", {}]],
  },
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  automaticVercelMonitors: false,
  telemetry: false,
  widenClientFileUpload: true,
});
