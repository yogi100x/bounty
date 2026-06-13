# Bounty — Convex backend

Server-authoritative backend for Bounty. Schema + functions are authored here
ahead of deployment (P2 head-start). **`convex/_generated/` does not exist yet**
— it is created by codegen, so imports of `./_generated/server` and
`./_generated/dataModel` will not typecheck until you run `convex dev`.

## Wire-up steps (run once keys are available)

1. Install + log in to Convex, then start the dev server to generate types and
   push the schema/functions:
   ```sh
   npx convex dev
   ```
   This creates `convex/_generated/` and provisions the deployment.

2. Set environment variables (Convex dashboard → Settings → Environment, and
   `.env.local` for local `convex dev`):
   - `CLERK_JWT_ISSUER_DOMAIN` — your Clerk Frontend API URL (e.g.
     `https://your-app.clerk.accounts.dev`). Used by `auth.config.ts`.

3. In the Clerk dashboard, create a **JWT template named `convex`** (matches the
   `applicationID: "convex"` in `auth.config.ts`).

4. In the Expo app, set `EXPO_PUBLIC_CONVEX_URL` (printed by `convex dev`) and
   wrap the app in `ConvexProviderWithClerk`.

## Files

- `schema.ts` — all tables (core + pre-wired fast-follow), with indexes.
- `lib/streak.ts` — pure, unit-testable streak engine (no Convex deps).
- `lib/users.ts` — `getOrCreateUser` / `requireUser` identity helpers + balance.
- `points.ts` — point constants + `computePoints`.
- `habits.ts` — `listForUser`, `dueToday`, `addCustom`, `archive`.
- `completions.ts` — `completeHabit` (idempotent once-per-local-day award).
- `rewards.ts` — `listCatalog`, `redeemReward` (oversell-proof).
- `circles.ts` — create/join/leave/invite-code lookup.
- `auth.config.ts` — Convex ↔ Clerk auth providers.

## Conventions

- **Server-authoritative:** every points change is an append-only `pointsLedger`
  entry carrying `balanceAfter`. Current balance = latest entry's `balanceAfter`.
- **Timezone:** the client computes `localDate` / `yesterdayISO` / `weekday` in
  the user's tz and passes them in; the server does no tz arithmetic.
- **Identity:** users are derived from `ctx.auth.getUserIdentity()` (Clerk
  subject), never from client-supplied ids.
