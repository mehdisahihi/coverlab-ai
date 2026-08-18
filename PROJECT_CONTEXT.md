# CoverLab AI — Project Context

> Purpose: Persistent project memory for future ChatGPT/AI coding sessions.
> Repository: `mehdisahihi/coverlab-ai`
> Primary branch: `main`
> Last context snapshot: 2026-08-18
>
> Rule: The repository code is the source of truth for implementation. This file records architecture, intent, workflow, constraints, and continuation guidance. If this file conflicts with current code, inspect the code and update this document.

## 1. Project Overview

CoverLab AI is a web application for creating scientifically responsible journal-cover artwork with AI.

The current product flow takes a researcher from research inputs through publication targeting, scientific assets, visual direction, concept generation, art direction, a production brief, and finally generated cover artwork.

The landing page positions the product as an AI-powered scientific cover-design tool and emphasizes preserving scientific direction and accuracy.

## 2. Current Tech Stack

Confirmed from `package.json`:

- Next.js `16.3.1`
- React `19.2.8`
- React DOM `19.2.8`
- TypeScript `^5`
- Tailwind CSS `^4`
- OpenAI Node SDK `^7.5.0`
- Zod `^3.25.76`
- ESLint `^9`
- `eslint-config-next` `16.3.1`

Package manager currently represented by `package-lock.json`: npm.

## 3. Important Framework Rule

`AGENTS.md` contains a Next.js-generated warning stating that this Next.js version has breaking changes and that relevant guidance under `node_modules/next/dist/docs/` should be checked before changing framework-sensitive code.

Future AI/code sessions should respect this rule rather than relying on older Next.js conventions from memory.

## 4. Repository Structure

Key project structure currently confirmed:

```text
/
├── AGENTS.md
├── CLAUDE.md
├── PROJECT_CONTEXT.md
├── README.md
├── app/
│   ├── api/
│   │   ├── concepts/
│   │   │   └── route.ts
│   │   ├── generate-artwork/
│   │   │   └── route.ts
│   │   └── production-brief/
│   │       └── route.ts
│   ├── create/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── create/
│       ├── ArtDirectorStep.tsx
│       ├── ArtworkStep.tsx
│       ├── AssetsStep.tsx
│       ├── ConceptsStep.tsx
│       ├── JournalStep.tsx
│       ├── ProductionBriefStep.tsx
│       ├── ResearchStep.tsx
│       └── VisualDirectionStep.tsx
├── public/
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## 5. Application Routes

### `/`

Landing page implemented in `app/page.tsx`.

Current major sections:

- Navigation
  - CoverLab AI branding
  - How it works
  - Examples
  - Pricing
  - Sign in button
- Hero
  - "AI-powered scientific cover design"
  - Main headline about turning research into remarkable cover art
  - CTA: `Create your cover →` linking to `/create`
  - CTA: `View examples`
  - Hero image at `/hero-cover.png`
- How it works
  - 01 Tell us about your research
  - 02 Choose your visual story
  - 03 Direct & refine

The current visual language is dark, premium, scientific, with cyan/violet accent treatments.

### `/create`

Implemented in `app/create/page.tsx` as a client-side multi-step workflow.

The top-level page owns the state for the workflow so information persists as users move between steps.

## 6. Create Workflow

The current workflow has eight steps:

1. **Research**
   - title
   - abstract
   - keywords

2. **Journal**
   - publisher
   - journal
   - artwork type

3. **Assets**
   - uploaded `File[]`
   - asset notes

4. **Visual direction**
   - visual style
   - visual emphasis
   - visual mood
   - visual notes

5. **Concepts**
   - AI-generated concept result
   - selected concept
   - concept result is intentionally kept in parent state to avoid unnecessary API regeneration when returning from Art Director

6. **Art direction**
   - realism
   - artistic freedom
   - composition
   - color direction
   - preserve uploaded scientific assets (default: `true`)
   - extra art notes

7. **Production brief**
   - generated production brief stored in parent state

8. **Artwork**
   - generated image stored in parent state as a data URL/string

Primary step components live under `components/create/`.

## 7. AI Concept Generation

Endpoint: `POST /api/concepts`

Implementation: `app/api/concepts/route.ts`

### Required input

- title
- abstract

Other supported context includes:

- journal
- publisher
- artworkType
- style
- emphasis
- mood
- visualNotes

### Model

Current code uses:

`gpt-5.6-luna`

### Output shape

Structured output validated with Zod.

Response contains:

- `scientific_summary`
- exactly 3 concepts

Each concept contains:

- `title`
- `idea`
- `scientific_elements[]`
- `artistic_elements[]`
- `composition`
- `caution`

### Core scientific rules

The concept-generation prompt explicitly requires:

- no invented scientific findings
- strict fidelity to supplied research
- separation of scientific content and artistic metaphor
- no unsupported mechanisms, molecular structures, interactions, conclusions, or causal claims
- exactly three visually distinct concepts
- scientific accuracy prioritized over visual drama

These are core product constraints and should not be weakened casually.

## 8. Production Brief Generation

Endpoint: `POST /api/production-brief`

Implementation: `app/api/production-brief/route.ts`

### Required input

- title
- abstract
- selectedConcept

The endpoint also receives the full publication context, earlier visual direction, asset metadata/instructions, and Art Director settings.

### Model

Current code uses:

`gpt-5.6-luna`

### Structured brief fields

The production brief currently includes:

- `visual_objective`
- `hero_subject`
- `mandatory_scientific_elements[]`
- `scientific_constraints[]`
- `composition`
- `spatial_layout[]`
- `materials_and_surfaces[]`
- `lighting_and_color`
- `atmosphere`
- `allowed_artistic_metaphors[]`
- `avoid[]`
- `asset_instructions[]`
- `image_generation_instruction`

The schema uses strict JSON output with `additionalProperties: false`.

### Priority order

The production-art-director prompt explicitly prioritizes:

1. Scientific accuracy
2. Fidelity to the selected concept
3. Fidelity to researcher-supplied art direction
4. Strong journal-cover composition
5. Visual impact

### Important constraints

The production brief must not invent unsupported scientific mechanisms or findings. Uploaded scientific assets should be preserved when requested. Journal mastheads, logos, author names, titles, labels, axes, and similar typography should not be introduced into the image prompt unless explicitly requested.

## 9. Artwork Generation

Endpoint: `POST /api/generate-artwork`

Implementation: `app/api/generate-artwork/route.ts`

### Model

Current code uses:

`gpt-image-2`

### Current generation parameters

- `n: 1`
- size: `1024x1536`
- quality: `medium`
- output format: `png`

The endpoint returns the generated PNG as a base64 data URL.

### Image-generation constraints

The generated image is intended to be:

- premium
- vertical
- suitable for a scientific journal cover
- free from journal mastheads, logos, article titles, author names, labels, captions, axes, and decorative typography
- scientifically plausible
- visually hierarchical with a clear focal point
- composed with useful negative space near the top for a future journal masthead
- recognizable as scientific subject matter rather than generic fantasy imagery

Unsupported scientific elements and meaningless decorative molecular/diagram-like elements should be avoided.

## 10. Current UI / Design Language

Confirmed implementation characteristics:

- dark background, notably `#070B14` on primary pages
- white primary text
- slate secondary text
- cyan accents
- occasional cyan-to-violet gradient accents
- rounded cards, buttons, and panels
- subtle white borders using low opacity
- responsive Tailwind utility classes
- desktop-oriented max width generally `max-w-7xl`
- `/create` switches to a sidebar + content grid at `lg`
- landing navigation hides its center links below `md`

This is the current implementation, not a fully formalized design system yet.

## 11. Global CSS State

`app/globals.css` still contains largely default create-next-app global theme values, including white/light variables and Arial/Helvetica fallback on `body`.

This means the actual page-level Tailwind styles currently define much of the visual identity. A formal global design-token cleanup has not yet been confirmed as completed.

## 12. Environment / Secrets

Server-side OpenAI routes use:

`process.env.OPENAI_API_KEY`

The API key must remain in environment configuration and must never be committed to the repository.

## 13. Current State Management

The `/create` workflow currently uses local React `useState` in `app/create/page.tsx`.

No persistent database-backed project state, authentication-backed user state, or dedicated state-management library is confirmed from the files inspected in this snapshot.

State currently disappears on a full page refresh unless a child component independently persists something (not assumed here).

## 14. Confirmed Product Principles

From current implementation and prompts:

- Scientific accuracy is the primary requirement.
- AI must not hallucinate scientific findings or mechanisms.
- Artistic metaphor is allowed only when clearly distinguishable from scientific claims.
- Researchers should retain visual/art-direction control.
- The system moves from research → concept → art direction → production brief → artwork rather than jumping straight from abstract to final image.
- Uploaded scientific assets should be preservable rather than arbitrarily distorted.

These principles should be treated as intentional unless explicitly changed.

## 15. Known / Open Areas

The following are not yet confirmed as complete and should be checked before assumptions are made:

- authentication / Sign in behavior
- pricing implementation
- examples/gallery implementation
- persistence of user projects
- database/backend storage
- real handling/uploading of scientific asset file contents (the top-level workflow currently stores browser `File[]`; API behavior should be checked before claiming file contents influence generation)
- deployment configuration
- production environment setup
- billing/subscriptions
- user accounts
- project history/versioning
- tests
- accessibility audit
- SEO/metadata completeness
- final responsive polish across all workflow steps
- formal design-token system

## 16. Files That Deserve Special Attention

Before making major workflow changes, inspect:

- `app/create/page.tsx`
- relevant component(s) under `components/create/`
- corresponding API route under `app/api/`
- `AGENTS.md`
- `package.json`
- this `PROJECT_CONTEXT.md`

## 17. Source-of-Truth Rules for Future AI Sessions

1. Current repository code outranks this context file for implementation details.
2. `PROJECT_CONTEXT.md` outranks assumptions based on prior AI memory.
3. Do not invent requirements that are not present in code, this file, or explicit user instructions.
4. Distinguish clearly between:
   - confirmed implementation
   - confirmed product decision
   - proposal
   - unknown/open question
5. Preserve scientific-safety constraints when changing prompts or generation logic.
6. Do not change model names, schemas, generation sizes, or workflow steps silently.
7. Check `AGENTS.md` and relevant local Next.js docs before framework-sensitive changes.
8. Never commit API keys or secrets.
9. After significant product/architecture changes, update this file in the same work session.

## 18. Handoff Procedure When a Chat Reaches Its Limit

In a new chat/session:

1. Connect/open repository `mehdisahihi/coverlab-ai`.
2. Read `PROJECT_CONTEXT.md` first.
3. Read `AGENTS.md`.
4. Inspect the specific implementation files relevant to the task.
5. Check recent commits/branch state if continuity matters.
6. Treat the latest code as source of truth.
7. Ask for or use a conversation handoff only for details that cannot live in code/context, such as subjective design preferences, recently discussed alternatives, rejected ideas, or an unfinished decision.
8. After completing substantial work, update `PROJECT_CONTEXT.md` if the architecture, product flow, model configuration, important constraints, or current next step changed.

## 19. Conversation Context at Snapshot Time

The repository was initially connected to ChatGPT after development had begun inside GitHub Codespaces. The first project files existed only in the Codespace working tree and had not yet been committed. They were then committed and pushed to `main`, making the current implementation available through the GitHub repository.

The purpose of adding this file is specifically to prevent important project context from being lost when a long ChatGPT conversation reaches its context/length limit.

## 20. Next-Step Field

This section should be actively maintained.

**Current next step:** Review the existing product implementation together with the user and capture any design/product decisions that exist in conversation history but are not inferable from the repository. Then continue development from the user's chosen priority.

## 21. Change Log for This Context File

### 2026-08-18

- Initial persistent project-context document created.
- Captured repository architecture, eight-step workflow, AI endpoints, current model usage, scientific constraints, design language, open areas, and future-chat handoff procedure.
