import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { withAxiom } from "next-axiom";

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.sentry-cdn.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' blob: data: https:;
  connect-src 'self' https://*.sentry.io https://o*.ingest.sentry.io https://api.axiom.co https://yuanyuaicloud.cn https://api.openai.com https://api.anthropic.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  output: "standalone",
  // Ensure gray-matter (used by getPostBySlug in /api/chat) is included in
  // the standalone output — Next.js file-tracing misses packages used only
  // inside React.cache() server functions called from API routes.
  outputFileTracingIncludes: {
    "/api/chat": ["./node_modules/gray-matter/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
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
