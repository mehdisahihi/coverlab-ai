import type { NextConfig } from "next";

const codespacesOrigin =
  process.env.CODESPACE_NAME &&
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
    ? `${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
    : null;

const allowedServerActionOrigins = codespacesOrigin
  ? [
      codespacesOrigin,
      "localhost:3000",
    ]
  : [];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: allowedServerActionOrigins,
    },
  },
};

export default nextConfig;
