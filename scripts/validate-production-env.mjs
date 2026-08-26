const errors = [];
const warnings = [];

function valueOf(name) {
  return process.env[name]?.trim() || "";
}

function isPlaceholder(value) {
  const normalized = value.toLowerCase();

  return (
    !value ||
    normalized.includes("your_") ||
    normalized.includes("your-") ||
    normalized.includes("example") ||
    normalized.includes("changeme") ||
    normalized.includes("replace_me") ||
    normalized.includes("replace-me")
  );
}

function requireValue(name) {
  const value = valueOf(name);

  if (isPlaceholder(value)) {
    errors.push(`${name} is missing or still uses a placeholder value.`);
    return "";
  }

  return value;
}

function validateSiteUrl() {
  const value = requireValue("SITE_URL");

  if (!value) {
    return;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      errors.push("SITE_URL must use https in production.");
    }

    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      errors.push(
        "SITE_URL must be an origin only, with no credentials, path, query, or fragment."
      );
    }

    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      errors.push("SITE_URL must not point to localhost in production.");
    }
  } catch {
    errors.push("SITE_URL must be a valid absolute URL.");
  }
}

function validateSupabase() {
  const urlValue = requireValue("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (urlValue) {
    try {
      const url = new URL(urlValue);

      if (url.protocol !== "https:") {
        errors.push("NEXT_PUBLIC_SUPABASE_URL must use https in production.");
      }

      if (url.username || url.password) {
        errors.push("NEXT_PUBLIC_SUPABASE_URL must not contain credentials.");
      }
    } catch {
      errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL.");
    }
  }

  if (key && !key.startsWith("sb_publishable_")) {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must use a modern sb_publishable_ key."
    );
  }
}

function validatePublicSecretNames() {
  const unsafeNames = Object.keys(process.env).filter((name) => {
    const upper = name.toUpperCase();

    return (
      upper.startsWith("NEXT_PUBLIC_") &&
      (
        (upper.includes("OPENAI") && upper.includes("KEY")) ||
        upper.includes("SERVICE_ROLE") ||
        upper.includes("TURNSTILE_SECRET")
      )
    );
  });

  for (const name of unsafeNames) {
    errors.push(`${name} must not be exposed through NEXT_PUBLIC_.`);
  }
}

validateSiteUrl();
validateSupabase();
requireValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
requireValue("OPENAI_API_KEY");
validatePublicSecretNames();

if (!valueOf("OPENAI_PROJECT_ID")) {
  warnings.push(
    "OPENAI_PROJECT_ID is not set. This is optional, but explicit project routing is recommended for production observability."
  );
}

if (valueOf("SUPABASE_SERVICE_ROLE_KEY")) {
  warnings.push(
    "SUPABASE_SERVICE_ROLE_KEY is present. CoverLab launch runtime does not require a service-role key; remove it from the deployment unless a separately reviewed server-only feature needs it."
  );
}

if (errors.length) {
  console.error("Production environment validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Production environment validation passed.");

if (warnings.length) {
  console.warn("Production environment warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}
