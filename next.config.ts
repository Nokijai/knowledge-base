import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { withAxiom } from "next-axiom";

const nextConfig: NextConfig = {
  output: "standalone",
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
