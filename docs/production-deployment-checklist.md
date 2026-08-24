# CoverLab AI production deployment checklist

This checklist is platform-neutral. Do not merge or deploy to the public production environment until the applicable items are complete.

## 1. Environment isolation

- Use a dedicated production deployment environment and encrypted secret store.
- Do not expose server credentials through `NEXT_PUBLIC_` variables.
- Do not provide `SUPABASE_SERVICE_ROLE_KEY` to the CoverLab web runtime unless a separately reviewed server-only feature explicitly requires it.
- Prefer separate staging and production Supabase/OpenAI resources. If preview deployments temporarily share infrastructure, do not give untrusted previews production OpenAI credentials.
- Use a dedicated production OpenAI Project/API key with the minimum permissions needed by CoverLab.

## 2. Canonical production origin

Set:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-host.example
```

Requirements:

- HTTPS only in production.
- Origin only: no path, query string, fragment, username, or password.
- Do not use localhost for production.
- DNS and TLS must be active before auth email links are enabled for public users.

The auth confirmation route fails closed in production if a trusted canonical origin cannot be resolved.

## 3. Required production environment variables

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
OPENAI_API_KEY
```

Optional server-only OpenAI routing identifiers:

```text
OPENAI_PROJECT_ID
OPENAI_ORG_ID
```

Run before deployment:

```bash
npm run validate:production-env
```

The validator reports variable names only and must never print secret values.

## 4. Supabase Auth URL configuration

In the production Supabase project:

- Set **Site URL** to the exact production application origin.
- Keep production redirect URLs as narrow and explicit as practical.
- Ensure the confirmation/recovery email templates route users through CoverLab's `/auth/confirm` handler with the Supabase token hash and type.
- Remove obsolete preview/development redirect URLs from the production project when they are no longer needed.
- Keep CAPTCHA enabled.
- Keep the Turnstile secret in Supabase Auth CAPTCHA settings, not in the repository or browser environment.

## 5. Cloudflare Turnstile

For the production Turnstile widget:

- Add the production hostname under Hostname Management.
- Prefer the specific application hostname when a narrower scope is possible.
- Enter a hostname only; do not include scheme, port, or path.
- Confirm the production `NEXT_PUBLIC_TURNSTILE_SITE_KEY` belongs to the intended widget.
- Do not put the Turnstile secret in a `NEXT_PUBLIC_` variable.

## 6. Production email / SMTP

Before public launch:

- Verify the CoverLab sending domain with the SMTP provider.
- Use a production sender address on the verified domain.
- Confirm signup confirmation and password-reset emails deliver outside test-mode recipient restrictions.
- Do not expose SMTP credentials in browser variables, logs, screenshots, or support messages.

## 7. OpenAI production controls

- Use a dedicated production OpenAI Project/API key.
- Keep the key server-only in the deployment secret store.
- Set project budget/spend alerts in the OpenAI dashboard.
- Review project usage after launch and after any traffic anomaly.
- Keep debug request/response logging disabled in production.
- Preserve CoverLab request IDs/provider request IDs for correlation without logging prompts, images, or provider response bodies.
- Synchronous Responses calls should remain `store: false` where configured.
- Background enhancement is stateful for polling and must not be described as zero-data-retention compatible.

## 8. Pre-deploy checks

Run from the release branch with production-shaped configuration:

```bash
npm run validate:production-env
npx tsc --noEmit
npm run build
npx tsx scripts/validate-launch-policies.ts
```

Also verify:

```bash
git diff --check
git grep -n -E 'new OpenAI|https://api\.openai\.com' -- app lib ':(exclude)lib/openai/client.ts'
```

The OpenAI audit should return no matches.

## 9. Post-deploy smoke checks

Verify on the production hostname:

- HTTPS works and HTTP redirects to HTTPS at the hosting/CDN layer.
- Security headers are present: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Signup/login/logout work with Turnstile enabled.
- Email confirmation and password reset return to the production hostname.
- Authenticated project create/resume/save/delete works.
- Private source-asset upload/remove works and assets are not public.
- Artwork version persistence/resume works.
- Policy-gated/manual-check behavior still blocks before AI usage reservation.
- Cross-origin AI requests return `403 AI_CROSS_ORIGIN_REJECTED` and do not increment `ai_usage_events`.
- The legacy root `/api/enhance-publication-artwork` endpoint returns `410 LEGACY_ENHANCEMENT_ENDPOINT_DISABLED`.
- Run one deliberately controlled billable AI smoke only after all non-billable checks pass.

## 10. CSP follow-up

Do not add a broad Content-Security-Policy just to check a launch box. Add CSP after the final production hostname and exact Supabase/Turnstile requirements are known, then test auth, Turnstile, image loading, storage downloads, and all publication workflows before enforcement.
