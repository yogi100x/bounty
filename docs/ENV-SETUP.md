# Bounty — Environment Setup (P2 wiring)

Goal: fill `.env` and the Convex dashboard so the app runs on real **Convex** (backend) + **Clerk** (Google & Apple auth). Steps you run are marked **▶ you**; code wiring is **◇ me**.

## What we need at the end

`.env` (app, client-visible — only publishable values):
```
EXPO_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```
Convex dashboard → Settings → Environment Variables:
```
CLERK_JWT_ISSUER_DOMAIN=https://<your-app>.clerk.accounts.dev
```

---

## Step 1 — Convex  ▶ you (interactive login)

```
! npx convex dev
```
- Opens a browser to log in / create a free Convex account, then creates a dev deployment.
- Writes `EXPO_PUBLIC_CONVEX_URL` into `.env` automatically.
- Generates `convex/_generated/` so the backend code we committed starts typechecking, and pushes the schema.
- Leave it running in its own terminal while developing (it watches `convex/`).

## Step 2 — Clerk app + keys  ▶ you

1. Create an application at **dashboard.clerk.com**.
2. Copy the **Publishable key** (`pk_test_…`) → put in `.env` as `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
3. **JWT template:** Clerk → *JWT Templates* → **New → Convex** preset → Save. Copy the **Issuer** URL it shows (e.g. `https://xxx.clerk.accounts.dev`).
4. Put that Issuer into **Convex** → Settings → Environment Variables as `CLERK_JWT_ISSUER_DOMAIN` (matches `convex/auth.config.ts`).

## Step 3 — Social connections  ▶ you

**Google (easy — works in Expo Go):**
- Clerk → *User & Authentication → Social Connections → Google* → enable. For development Clerk provides **shared OAuth credentials** (no Google Cloud setup needed). For production you add your own Google OAuth client later.

**Apple (needs a paid Apple Developer account + a dev build):**
- Apple does **not** offer shared dev credentials, and Apple sign-in does **not** work in Expo Go — it requires a dev/EAS build on iOS.
- Requires an **Apple Developer Program** membership ($99/yr): create a Services ID, an App ID, and a Sign-in-with-Apple key (Key ID + .p8), then paste them into Clerk → *Social Connections → Apple*.
- Recommended: ship **Google first** now; add Apple when you do the iOS dev build.

## Step 4 — Run target

- **Expo Go:** Convex + Google auth work. (Local notifications limited; Apple unavailable.)
- **Dev build** (`npx expo run:ios` / EAS) needed for: Apple sign-in, in-app CameraView (P4 BeReal), reliable local notifications.

---

## Division of labor at wire-up

**▶ you** (this doc): run `convex dev`, create the Clerk app, set the 3 env values, enable Google (+ Apple if doing the dev-build path).

**◇ me** (once `.env` is filled): 
- Add `ConvexProviderWithClerk` + `ClerkProvider` + a secure-store token cache to `src/app/_layout.tsx`.
- Build the **sign-in screen** (Continue with Google / Apple) as the first gate before onboarding.
- Swap the mock store internals for Convex queries/mutations behind the same `useAppStore` interface (auth, persistence, server-authoritative streaks/points, proof upload to Convex file storage).
- Add `getOrCreateUser` provisioning on first sign-in; wire account deletion.
- Verify: `tsc` + `expo export` + live sign-in → onboarding → first win persists across reloads.

## Quick verification checklist
- [ ] `.env` has `EXPO_PUBLIC_CONVEX_URL` + `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Convex env has `CLERK_JWT_ISSUER_DOMAIN`
- [ ] `convex/_generated/` exists (created by `convex dev`)
- [ ] Clerk: Google enabled (+ `convex` JWT template)
- [ ] `npx convex dev` running without errors
