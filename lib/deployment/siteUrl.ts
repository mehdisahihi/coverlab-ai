import "server-only";

import type {
  NextRequest,
} from "next/server";

function configuredSiteOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL
      ?.trim();

  if (!raw) {
    return null;
  }

  try {
    const url =
      new URL(raw);

    if (
      ![
        "http:",
        "https:",
      ].includes(
        url.protocol
      ) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    if (
      process.env.NODE_ENV ===
        "production" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function codespacesOrigin() {
  const codespaceName =
    process.env.CODESPACE_NAME;
  const forwardingDomain =
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;

  if (
    !codespaceName ||
    !forwardingDomain
  ) {
    return null;
  }

  return `https://${codespaceName}-3000.${forwardingDomain}`;
}

export function resolveTrustedAppOrigin(
  request: NextRequest
) {
  const configured =
    configuredSiteOrigin();

  if (configured) {
    return configured;
  }

  const codespace =
    codespacesOrigin();

  if (codespace) {
    return codespace;
  }

  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return null;
  }

  return request.nextUrl.origin;
}
