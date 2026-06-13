# Bounty — Product Requirements Document (V1, No-Mascot Variant)

**Status:** Draft for review
**Date:** 2026-06-13
**Owner:** Yogi
**Platform:** Native mobile (Expo / React Native), Convex backend
**Variant note:** This is the **mascot-free** version of `docs/PRD-V1.md`. There is no companion character (no Karmi). The emotional engine is **social accountability (Circles)** + **visible personal progress**.

---

## 1. Summary

Bounty V1 is a **social habit-building app**. Users pick habits (from a curated library or their own), prove they completed them — sometimes via a timed BeReal-style photo — and earn points and streaks. They build habits alongside a small **Circle** of up to 6 friends for accountability. Points and streaks unlock badges and brand-funded marketplace rewards.

The thesis: habits stick when they're **witnessed**. Small private pods + lightweight proof turn a solo grind into a shared, accountable ritual.

## 2. Goals & Non-Goals

### Goals
- Ship a focused V1 that gets a user from install → first proven habit → in a circle, in one sitting.
- Make accountability feel warm and social, not competitive (pods, not global leaderboards).
- Establish the points ledger as the economic spine for rewards.

### Non-Goals (V1)
- Public global leaderboards (replaced by Circles).
- Web/PWA (rebuild is mobile-only).
- **Companion/mascot character** (explicitly excluded in this variant).
- B2B brand dashboard / self-serve marketplace onboarding (post-V1; rewards manually curated for V1).
- Email/password or multi-provider auth (Google-only for V1).

## 3. Target User

People who want to build daily habits and stick to them through light social accountability — friends doing a "30-day" challenge together, gym buddies, study groups, recovery/wellness micro-communities.

## 4. Success Metrics (proposed)

| Metric | Target intent |
|---|---|
| Activation: % new users who prove ≥1 habit on day 0 | High |
| % users in a circle with ≥1 other active member | Primary retention lever |
| D7 / D30 retention | Core health |
| Median active streak length | Habit-formation signal |
| % proofs submitted via BeReal prompt vs manual | Engagement quality |

> Exact targets TBD — see Open Decisions.

---

## 5. Features

### 5.1 Authentication — Google Sign-In only
- **Single auth path:** "Continue with Google." No email/password, no other providers in V1.
- First sign-in provisions the user record (profile, avatar, empty points ledger).
- Auth provider: **Clerk** (chosen for V1).
- **Requirements:** persistent session; sign-out; account deletion path (store-compliance).

### 5.2 Onboarding Screens
A short flow after first sign-in:
1. **Welcome / how it works** — explain the core loop (pick → prove → streak → circle).
2. **Pick your first habit(s)** — from the curated library (5.3), seeds activation.
3. **Set proof preference / notification time** — when to nudge (and fire the BeReal prompt).
4. **Start or join a Circle** — optional; invite a friend or skip.
- **Requirements:** progress indicator; resumable; user lands on the Today screen with ≥1 habit chosen.

### 5.3 Habits — Curated Library + Custom
- **Curated ("Internal") library:** pre-defined habits with name, icon, category, suggested cadence, default point value.
- **Custom habits:** user-created — name, icon/emoji, cadence (daily / specific weekdays), proof-required toggle.
- Each habit has a **cadence** driving the Today screen and streak logic.
- **Requirements:** add / edit / archive; "Today" view of what's due; mark complete (with proof when required).

### 5.4 Proof Submission
- Completing a habit can require **proof**: a photo and/or short note.
- Entry points: (a) manual; (b) **BeReal prompt** (5.7) — timed capture.
- Proof is **visible to the user's Circle(s)** (the accountability mechanic). Solo users' proof is private.
- **Requirements:** capture/pick photo; optional caption; timestamp; attach to completion; appears in circle feed.
- **Privacy note:** decide proof storage/visibility model early — see Open Decisions.

### 5.5 Circle of Friends (Pods)
- A **Circle** is a small accountability pod, **max 6 people**.
- **Private circles:** invite-only (link / code).
- **Public circles:** discoverable and joinable until the 6-person cap.
- Members see each other's **proofs, streaks, and completions** in a shared feed.
- **Requirements:** create (name, public/private); invite via link/code; join public; leave; enforce 6-member cap; activity feed; lightweight reactions (cheers). Multiple circles per user — see Open Decisions.

### 5.6 Streaks
- Per-habit consecutive-completion counter, evaluated against cadence.
- Track **current** and **longest** streak.
- Streaks drive **badges** (5.8) and feed the points model.
- **Requirements:** define day-boundary (timezone) and grace rules (hard reset vs freeze/grace) — see Open Decisions. Streaks visible on the habit, profile, and circle feed.

### 5.7 BeReal-style Timed Proof
- At a (daily, possibly randomized) moment, a push notification asks the user to capture a photo **now** to prove a habit.
- Reinforces authenticity and creates a shared daily ritual within a circle.
- **Requirements:** scheduled push; camera capture; expiry/"late" window after which the prompt closes; photo flows into Proof Submission (5.4). Shared circle window vs per-user — see Open Decisions.

### 5.8 Avatar
- Each user has a **profile avatar** (photo or chosen image/initials). Purely identity/personalization — **no companion character**.
- **Requirements (V1):** default avatar + basic personalization (upload photo or pick a preset). No streak/points-driven "evolution."

### 5.9 Rewards — Marketplace + Badges
- **Badges:** earned for streak milestones (e.g. 7 / 30 / 100 days) and achievements. Shown on profile and in circle.
- **Marketplace:** redeem **available points** for **brand-funded** rewards. V1 catalog **manually curated**.
- **Requirements:** badge definitions + award logic; catalog (item, cost, availability); redemption flow debiting the ledger; redemption history.

### 5.10 Points Ledger
- The economic spine: an **append-only ledger** of every point earned and spent.
- Balances: **spendable points** (`available_points`, with `lifetime_earned` / `lifetime_spent`). Separate weekly/circle score — see Open Decisions.
- **Earn events:** completing habits, submitting proof, streak milestones, on-time BeReal capture.
- **Spend events:** marketplace redemptions.
- **Requirements:** every balance change is a ledger entry (type, amount, source, timestamp, balance-after); server-authoritative; user-facing history view.

---

## 6. Core User Flow

1. Install → **Continue with Google** → **Onboarding** (how it works → pick habit → set notify time → join/create circle).
2. Land on **Today** with chosen habit(s).
3. Receive **BeReal prompt** → capture proof.
4. Proof posts to the **Circle feed**; streak increments; **points** credited to the ledger.
5. Circle members react/cheer.
6. Streak milestone → **badge**; accumulated points → redeem in **marketplace**.

## 7. Data Model (high level, Convex)

- `users` — profile, avatar, auth identity, notification prefs.
- `habits` — owner, name, icon, category, cadence, proofRequired, isCustom, source, pointValue, archived.
- `habitCompletions` — user, habit, date, proofId?, source(manual/bereal), onTime.
- `proofs` — user, habit, photoRef, caption, createdAt, visibility.
- `circles` — name, visibility(public/private), inviteCode, memberCount(≤6).
- `circleMembers` — circle, user, role, joinedAt.
- `streaks` — user, habit, current, longest, lastCompletedDate.
- `pointsLedger` — user, delta, type(earn/spend), source, refId, balanceAfter, createdAt.
- `badges` / `userBadges` — definition + awards.
- `rewards` / `redemptions` — catalog + redemption records.

## 8. Out of Scope for V1
- Companion/mascot character.
- B2B brand self-serve marketplace.
- Global/public leaderboards.
- Web app.
- AI prompt generation (tracked separately).

## 9. Open Decisions

1. **Multiple circles per user:** allowed, or one at a time?
2. **BeReal window:** shared circle-wide moment, or per-user scheduled time?
3. **Streak rules:** hard reset on miss, or grace/freeze (and timezone day-boundary)?
4. **Proof privacy:** stored where; visible only to circle vs publicly; retention/deletion.
5. **Points model:** keep a weekly/circle score, or spendable-only for V1?
6. **Public circle discovery:** browse/search list, or invite-link-only.
7. **Success-metric targets:** set concrete numbers for §4.

## 10. Phasing (suggested)

- **Phase 1 (foundation):** Google auth, onboarding, habits (library + custom), Today screen, points ledger, streaks.
- **Phase 2 (social):** Circles (private + public), proof submission, circle feed, reactions.
- **Phase 3 (ritual + economy):** BeReal timed proof + push, badges, marketplace redemptions, avatar personalization.
