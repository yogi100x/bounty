# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **^ Read that first.** Expo SDK 56 changed APIs significantly — consult the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo/RN code. Do not rely on pre-SDK-56 memory.

## What this is

**Bounty** — a social habit-building app. Pick habits, prove them (sometimes via a timed BeReal-style photo), earn streaks/points, and stay accountable in a private Circle of ≤6 friends. Direction is **no-mascot**: the engagement engine is social accountability + visible personal progress, not a companion character.

The repo is currently an **Expo default template + installed deps — effectively greenfield.** There is no `convex/` backend, no `tailwind.config.js`, and only template screens (`src/app/index.tsx`, `explore.tsx`). Nearly all app surface is yet to be built; `docs/` is the source of truth for what to build.

## Stack

- **Expo SDK ~56** / React Native 0.85 / React 19.2, `expo-router` (file-based, **typed routes** + **React Compiler** both enabled in `app.json`)
- **Convex** backend (`convex@^1.41`) — not yet scaffolded
- **Clerk** auth (`@clerk/clerk-expo`) — **Google + Apple Sign-In** for V1, no email/password or other providers
- **NativeWind 4** + **Tailwind 3** for styling (no `tailwind.config.js` exists yet — create from the design tokens in `docs/DESIGN-SYSTEM.md`)
- **Zustand** for client state; `expo-secure-store` for token persistence
- TypeScript `strict`

## Commands

```bash
npm install            # uses local ./.npm-cache (see .npmrc — avoids a root-owned ~/.npm issue)
npx convex dev         # provisions backend, writes EXPO_PUBLIC_CONVEX_URL into .env
npm run ios            # / npm run android / npm run web / npm start
npm run lint           # expo lint (eslint) — the only check; there is NO test runner configured
npm run reset-project  # template scaffold reset (rarely needed)
```

Env: copy `.env.example` → `.env`, fill `EXPO_PUBLIC_CONVEX_URL` (from `convex dev`) and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

## Conventions

- **Path aliases:** `@/*` → `src/*`, `@/assets/*` → `assets/*`. Routes live in `src/app/`.
- **Platform variants:** `.web.tsx` / `.web.ts` files override the native default (e.g. `app-tabs.tsx` vs `app-tabs.web.tsx`). Keep both in sync when adding platform-specific behavior.
- **Theming:** the template ships a generic `Colors`/`useTheme` in `src/constants/theme.ts` + `src/hooks/`. The product is **dark-first, near-black navy + a single violet accent** — migrate styling to the NativeWind tokens defined in `docs/DESIGN-SYSTEM.md` rather than extending the placeholder `Colors` object.
- Editor runs `fixAll` + organize/sort imports on save (`.vscode/settings.json`); match that ordering.

## Where the design lives (read before building features)

- `docs/PRD-V1-no-mascot.md` — features, goals/non-goals, scope. **The `-no-mascot` docs are authoritative**; ignore mascot / "sunny sky" / on-device-journaling direction from any source `karmic_pwa` references.
- `docs/IMPLEMENTATION-PLAN.md` — phasing + **the full Convex data model** (define the entire schema in Phase 1, including pre-wired fast-follow tables, to avoid migrations).
- `docs/USER-JOURNEY-V1-no-mascot.md` — the 5 user stages.
- `docs/DESIGN-SYSTEM.md` — color/type/radius/spacing tokens (drop into `tailwind.config.js`).
- `docs/DESIGN-SPEC.md` — motion, celebration moments, haptics, voice, accessibility.

## Critical sequencing rule

The **first-win loop (nudge → capture proof → award moment) ships in Phase 1** with a *manual* proof-capture path — it must NOT wait for Circles (Phase 2) or the timed BeReal nudge (Phase 3). This intentionally overrides the PRD's original phase numbering; see `IMPLEMENTATION-PLAN.md` §1. The award/first-win moment is the emotional core and must hit 60fps on mid-range Android (profile from Phase 1, not at polish).

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
