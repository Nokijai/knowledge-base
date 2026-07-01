import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { withAxiom } from "next-axiom";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      // Ensure gray-matter (used by getPostBySlug in /api/chat) is bundled
      // in the standalone output — Next.js file-tracing misses it otherwise.
      "/api/chat": ["./node_modules/gray-matter/**/*"],
    },
  },
};

const sentryOptions = {
  org: "nokiproject-tkqx",
  project: "knowledge-base",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
};

export default withSentryConfig(withAxiom(nextConfig), sentryOptions);
