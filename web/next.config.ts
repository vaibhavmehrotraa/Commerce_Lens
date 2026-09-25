import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The /api/explore routes read data/commerce_sessions.csv via fs at
  // request time (not a static import), so Next's serverless file tracer
  // won't pick it up automatically -- without this, the file is present
  // locally but missing from the deployed function, and the Data Explorer
  // throws ENOENT in production. See lib/server/dataset.ts.
  outputFileTracingIncludes: {
    "/api/explore": ["./data/commerce_sessions.csv"],
    "/api/explore/meta": ["./data/commerce_sessions.csv"],
  },
};

export default nextConfig;
