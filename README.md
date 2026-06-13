# Bounty

Social habit-building app. Build daily habits, prove them, earn streaks & points, and stay accountable in a Circle of up to 6 friends.

- **Direction:** no-mascot (Circle + personal progress as the engagement engine)
- **Stack:** Expo (React Native) + expo-router · Convex backend · Clerk auth (Google-only) · NativeWind
- **Docs:** product specs live in `../karmic_pwa/docs/` (`PRD-V1-no-mascot.md`, `USER-JOURNEY-V1-no-mascot.md`, `DESIGN-SYSTEM.md`)

## Setup

```bash
npm install                # uses local ./.npm-cache (see .npmrc)
cp .env.example .env       # fill in Convex + Clerk keys
npx convex dev             # provisions backend, writes EXPO_PUBLIC_CONVEX_URL
npm run ios                # or: npm run android / npm start
```

Note: a local npm cache (`./.npm-cache`) is configured in `.npmrc` to avoid a root-owned `~/.npm` permission issue on this machine.
