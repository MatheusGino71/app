import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  agentRules: false,
  turbopack: { root: process.cwd() },
  outputFileTracingExcludes: { "/*": ["./.data/**/*", "./.npm-cache/**/*", "./referencias/**/*", "./.git/**/*"] },
};

export default nextConfig;
