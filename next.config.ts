import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { withAxiom } from "next-axiom";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ensure gray-matter (used by getPostBySlug in /api/chat) is included in
  // the standalone output — Next.js file-tracing misses packages used only
  // inside React.cache() server functions called from API routes.
  outputFileTracingIncludes: {
    "/api/chat": ["./node_modules/gray-matter/**/*"],
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
