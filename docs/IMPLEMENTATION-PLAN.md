# Bounty — Implementation Plan (V1)

**Status:** Draft for review
**Date:** 2026-06-13
**Owner:** Yogi
**Stack:** Expo / React Native (SDK 56) + expo-router · Convex backend · Clerk (Google + Apple) auth · NativeWind · Zustand
**Related:** `docs/PRD-V1-no-mascot.md`, `docs/USER-JOURNEY-V1-no-mascot.md`, `docs/DESIGN-SYSTEM.md`, `docs/DESIGN-SPEC.md`

> This plan folds in the 2026-06-13 gap audit against the source `karmic_pwa` planning docs. Mascot, on-device gratitude journaling, AI prompts, and the “sunny sky” palette from the source are **intentionally out of scope** — Bounty is the no-mascot, social photo-proof variant on the dark-violet design system.

---

## 0. Current state (scaffold reality)

The repo is the default Expo template plus installed deps — effectively greenfield:
- Installed: `@clerk/clerk-expo`, `convex`, `expo-camera`, `expo-notifications`, `expo-image-picker`, `expo-secure-store`, `nativewind` + `tailwindcss`, `zustand`, `expo-haptics`, `react-native-reanimated`.
- **Missing:** no `convex/` backend, no `tailwind.config.js`, no real screens (only template `index.tsx` / `explore.tsx`).

So every phase below starts from zero on the app surface.

---

## 1. Phasing overview & the sequencing fix

The PRD lists 3 build phases; the journey describes 5 user stages. The audit surfaced one **critical contradiction**: the journey makes the Stage-0 *first-win* (“nudge → capture proof → confirmation”) the #1 priority, but proof submission is PRD Phase 2 and the BeReal nudge is Phase 3 — i.e. the emotional core would ship last.

**Resolution adopted here:** pull a **minimal manual proof-capture + the award/first-win moment into Phase 1.** Circles (Phase 2) and the timed BeReal nudge (Phase 3) then layer on top of a loop that already feels good solo.

| Phase | Theme | Serves journey stage |
|---|---|---|
| **0** | Foundation / setup | (pre-req) |
| **1** | The first-win loop (solo) | Stage 0–1 |
| **2** | Social (Circles) | Stage 2 |
| **3** | Ritual + economy | Stage 1 (nudge), 3, 4 |
| Fast-follow | pre-wired, post-V1 | Stage 4 |

---

## 2. Convex data model

Define the **full** schema in Phase 1 — including tables for fast-follow features — so V1 ships without migrations later.

**Core (V1):**
- `users` — clerkId, name, avatarRef, timezone, createdAt.
- `habits` — ownerId, name, icon, category, cadence, proofRequired, isCustom, source(`library`|`custom`), pointValue, archived.
- `habitCompletions` — userId, habitId, localDate, proofId?, source(`manual`|`bereal`), onTime, createdAt. **Unique (userId, habitId, localDate)** for idempotency.
- `proofs` — userId, habitId, completionId, photoStorageId, caption?, visibility(`circle`|`private`), createdAt.
- `circles` — name, visibility(`public`|`private`), inviteCode, memberCount(≤6), createdBy.
- `circleMembers` — circleId, userId, role, joinedAt.
- `streaks` — userId, habitId, current, longest, lastCompletedDate.
- `pointsLedger` — userId, delta, type(`earn`|`spend`), source, refId, balanceAfter, createdAt (append-only).
- `badges` / `userBadges` — definition + awards.
- `rewards` / `redemptions` — catalog (item, cost, stock, type `brand`|`cause`) + redemption records.

**Pre-wired in Phase 1, populated by later features (avoid migrations):**
- `streakPauses` — userId, habitId, usedOn, remaining (mercy/freeze mechanic).
- `notificationPrefs` — userId, dailyNudgeTime, berealEnabled, streakAtRisk, circleActivity, quietHours.
- `circleEvents` — circleId, actorId, type(`proof`|`cheer`|`joined`|`milestone`), refId, createdAt (granular feed).
- `milestones` — userId, type, value, achievedAt (powers progress story + future “on this day”).

---

## 3. Critical server-authoritative logic

These are the highest-risk pieces; spec and unit-test them hard.

- **`completeHabit` / `awardPoints` mutation** — **idempotent once-per-local-day** (client passes timezone; enforced by the unique completion index). Atomically: write completion → increment streak (mercy-aware) → append ledger earn entry → emit milestone/`circleEvents` if a threshold is crossed. No double-credit on double-submit.
- **Streak engine** — pure, unit-tested functions: consecutive-day calc against cadence, timezone day-boundary, DST, pause-consumption, pause-then-return, hard-reset rules. (Resolves PRD Open Decision #3.)
- **`redeemReward` mutation** — atomic: balance check + stock decrement + redemption record + ledger spend entry. Concurrency-tested so the catalog cannot oversell.

**Proposed point values (tunable):** completion `+10`; proof attached `+5`; on-time BeReal capture `+5` bonus; streak milestones `7 → +50`, `30 → +200`, `100 → +500`. Finalize before ledger work (PRD Open Decision #5).

---

## Phase 0 — Foundation / setup

- [ ] Create `tailwind.config.js` from the DESIGN-SYSTEM token block; wire NativeWind + `global.css`.
- [ ] Load fonts (Clash Display + Inter) via `expo-font`.
- [ ] Clerk provider + Google & Apple OAuth; persist session with `expo-secure-store`.
- [ ] `convex init`; author full `convex/schema.ts` (§2); wire Clerk ↔ Convex auth.
- [ ] expo-router structure: auth gate → onboarding route group → tabs (Today / Circle / Rewards / Profile).
- [ ] Motion/haptic token module per `DESIGN-SPEC.md` (spring configs, easing, named haptics).
- [ ] CI: typecheck + `expo lint`; add Sentry crash reporting + content-free analytics scaffolding.

## Phase 1 — The first-win loop (solo)

*Goal: install → sign in → onboard → prove one habit → satisfying confirmation, with no Circle required.*

- [ ] **Auth:** Continue-with-Google + Continue-with-Apple screen; first-sign-in provisioning (user + empty ledger + timezone); sign-out.
- [ ] **Trust surface:** privacy explainer + in-app **account deletion** flow (store-compliance — not deferred).
- [ ] **Onboarding:** 4 steps (how it works → pick habit → set check-in time → optional start/join Circle), resumable, progress indicator; lands on Today with ≥1 habit.
- [ ] **Habits — library:** curated seed data (name, icon, category, cadence, pointValue); browse + add.
- [ ] **Habits — custom:** create / edit / archive (name, icon/emoji, cadence, proofRequired).
- [ ] **Today screen:** “due today” computed from cadence; complete control; current-streak badge.
- [ ] **Minimal manual proof capture:** `expo-camera` / `expo-image-picker` + optional caption, attached to completion (private until Circles exist). *(Pulled forward per §1.)*
- [ ] **Streaks + mercy:** current/longest; cadence-aware increment; `streakPauses` mechanic; timezone day-boundary (§3).
- [ ] **Points ledger:** append-only earn on completion; server-authoritative; user-facing history view.
- [ ] **The award / first-win moment:** count-up + streak tick + celebration + haptic per `DESIGN-SPEC.md`. This is the emotional core — build it now, profiled on mid-range Android.

## Phase 2 — Social (Circles)

*Goal: convert solo retention into social retention — the primary moat.*

- [ ] **Circles:** create (name, public/private); leave; enforce ≤6 cap.
- [ ] **Invite → install → auto-join:** invite link/code carries a new friend tap → install → sign-in → **lands inside the Circle** (deep link via `expo-linking`). Design end-to-end — this is the social wedge.
- [ ] **Public circle discovery:** browse/search joinable circles until cap (or invite-link-only — PRD Open Decision #6).
- [ ] **Proof sharing:** flip proof `visibility` to circle; render in feed.
- [ ] **Circle feed:** members’ proofs, streaks, completions (driven by `circleEvents`).
- [ ] **Cheers/reactions:** a deliberate fixed set (no emoji-as-icons per design system); low-friction, one-tap; emits `circleEvents` + (optional) notification.
- [ ] **Empty-circle warmth:** a Circle-of-one and a fresh feed must feel inviting — copy + visuals (`DESIGN-SPEC.md` Empty states).
- [ ] Multiple-circles-per-user decision (PRD Open Decision #1).

## Phase 3 — Ritual + economy

*Goal: the daily ritual, visible self-transformation, and the reward economy.*

- [ ] **BeReal timed proof:** scheduled push (`expo-notifications`), capture-now, expiry/“late” window, `onTime` flag → bonus; shared-circle vs per-user window (PRD Open Decision #2).
- [ ] **Full notification set:** daily nudge, **streak-at-risk evening ping**, **circle-activity** notifications; quiet-by-default + per-type control via `notificationPrefs`.
- [ ] **Badges:** definitions + award logic at milestones (7/30/100); profile shelf + circle visibility.
- [ ] **Marketplace:** curated catalog (item, cost, stock, availability); `redeemReward` flow (§3); redemption history. **Seed with `cause`/donation rewards** so redemption works at launch without brand deals.
- [ ] **Avatar:** default + upload/preset personalization (no evolution).
- [ ] **Profile “trophy case”:** current/longest streaks, badge shelf, total proofs, points + ledger view.
- [ ] **Progress story:** a real V1 surface — “you’ve come this far” (e.g. “21 days of movement”: streak chart, totals, badges). The no-mascot substitute for watching a pet grow; powered by `milestones`.
- [ ] **Re-engagement:** lapsed-user push triggered off last-completion date (“your Circle missed you” when in a pod; gentle solo nudge otherwise) — warm, never guilt-based.

---

## Cross-cutting (every phase, not a cleanup pass)

- **Timezone/day-boundary** correctness across streaks, “due today,” and the once-per-day award guard — pure, unit-tested (DST, double-submit, pause-then-return).
- **Accessibility:** Dynamic Type / font scaling, VoiceOver/TalkBack on the core loop, **reduced-motion variants** of all celebrations. Profile animations on mid-range Android.
- **Observability / store-readiness:** Sentry crashes, content-free analytics (event names only), privacy nutrition labels, App Store / Play deletion + privacy disclosures.
- **Offline feel:** habit completion is optimistic + queued; proof upload retries (proof is inherently online — lighter than the source’s local-first journal).

## Fast-follow (post-V1, schema pre-wired in Phase 1)

- Widgets (home/lock-screen streak) — deferred for Expo config-plugin friction.
- Weekly recap; “on this day” resurfacing; seasonal/group Circle challenges (Stage 4 surprise layer).
- Quantity habit type (“drink 8 glasses”) — currently check-off only.

## Carried-over open decisions (PRD §9)

1. Multiple circles per user. 2. BeReal window (shared vs per-user). 3. Streak rules + timezone (engine in §3). 4. Proof privacy/storage/retention. 5. Points model + values (§3). 6. Public circle discovery. 7. Success-metric targets.

## Risks & mitigations

- **First-win ships late** → sequencing fix (§1): minimal manual proof + award moment in Phase 1.
- **Marketplace cold-start** (no brand deals) → launch with `cause`/donation rewards.
- **Streak/timezone correctness** → pure functions, hard unit tests before UI.
- **Animation jank on cheap Android** → profile the award moment from Phase 1; reduced-motion variants mandatory.
- **Proof privacy/compliance** → resolve storage + retention + deletion model before Phase 2 sharing.
