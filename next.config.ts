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

const securityHeaders = [
  {
    key:
      "X-Content-Type-Options",
    value:
      "nosniff",
  },
  {
    key:
      "X-Frame-Options",
    value:
      "DENY",
  },
  {
    key:
      "Referrer-Policy",
    value:
      "strict-origin-when-cross-origin",
  },
  {
    key:
      "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  experimental: {
    serverActions: {
      allowedOrigins:
        allowedServerActionOrigins,
    },
  },

  async headers() {
    return [
      {
        source:
          "/(.*)",
        headers:
          securityHeaders,
      },
    ];
  },
};

export default nextConfig;
