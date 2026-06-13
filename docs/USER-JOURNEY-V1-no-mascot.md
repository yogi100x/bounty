# Bounty — User Journey to "Finch Level" (No-Mascot Variant)

**Date:** 2026-06-13
**Variant note:** Mascot-free version of `docs/USER-JOURNEY-V1.md`. No companion character. The engagement that Finch gets from its pet, we get from **two engines instead: (1) social accountability via the Circle, and (2) the user's own visible transformation.**
**Related:** `docs/PRD-V1-no-mascot.md`, `docs/DESIGN-SPEC.md`

---

## The challenge: Finch-level love without a creature to love

Finch's moat is the emotional contract with a pet that depends on you. We've removed the pet. So we have to replicate the *outcomes* that contract produced — attachment, reciprocity, gentleness, visible growth, surprise — through different mechanics.

What replaces the companion:

1. **The Circle as the reciprocity engine.** Real people see your proof and cheer. Being witnessed by friends you chose is a *stronger* obligation than a cartoon's sad face — and it's our wedge over Finch, which is solo.
2. **The user's own progress as the "growing creature."** The thing that visibly grows is **you**: your streak, your badge shelf, your before/after, your record of who you're becoming. The profile is the avatar of your effort.
3. **Tone does the gentleness.** Without a pet to emote, warmth lives in copy, pacing, and miss-handling. No red broken-streak shaming — recoverable and kind.

---

## The journey, stage by stage

### Stage 0 — First open (the first-win moment)
**Goal: activation in <3 minutes — leave with a real win, not an empty dashboard.**
- Continue with Google → a one-screen "how it works."
- Pick **one** habit (curated, one tap — don't overwhelm).
- Set a daily check-in time (becomes the BeReal/nudge moment).
- **Payoff:** complete the first action immediately → a satisfying confirmation (streak starts at 1, first points land, a crisp "you did it"). The win is *yours*, framed as momentum begun.
- Soft prompt to start/join a Circle — optional, never blocks the first win.

> Finch parallel without the pet: you don't leave onboarding empty-handed; you leave having already done the thing once, with a streak alive.

> **Build note (sequencing):** the first-win loop must exist in **Phase 1** with a *manual* proof-capture path — it cannot wait for Circles (Phase 2) or the BeReal nudge (Phase 3). Ship a minimal capture + the award moment first; layer the timed prompt and social feed on top. See `IMPLEMENTATION-PLAN.md` §1.

### Stage 1 — Day 1–3 (the loop proves itself)
**Goal: show the daily loop is fast, satisfying, and judgment-free.**
- Daily nudge → **BeReal-style capture** → proof → instant confirmation → points credited.
- Optional micro-note after proof (lightweight journaling) — keeps an emotional thread to *why* the habit matters.
- First **streak** builds. Show momentum, not pressure.
- **Miss handling:** a missed day is met with an encouraging, blame-free path back ("pick up where you left off"). No shaming UI. A **streak pause/freeze** (free, limited uses) is a real V1 mechanic — not just copy — so a single miss doesn't erase weeks. (Timezone day-boundary + pause rules — PRD Open Decision #3; engine in `IMPLEMENTATION-PLAN.md` §3.)

### Stage 2 — Day 3–10 (the social hook — our primary moat)
**Goal: convert solo retention into social retention, the strongest lever and the pet's replacement.**
- Strong nudge to bring **1 friend** into a private Circle (≤6): "habits stick when someone's beside you."
- **Invite → install → auto-join:** the invite link/code must carry a new friend from tap → app install → sign-in → landing **directly inside your Circle** (deep link). This end-to-end path is the social wedge — design it fully, not just "share a code."
- **Empty-circle warmth:** a Circle of one (you, waiting for a friend) and a fresh feed must feel inviting, not barren — copy and visuals carry the warmth here, since there's no mascot. (See `DESIGN-SPEC.md` §6 Empty states.)
- Circle feed: see friends' proofs and streaks. **Cheers/reactions** create the reciprocity loop the pet used to.
- Shared BeReal moment (if circle-wide window) = a daily group ritual you don't want to be the one to skip.
- **First badge** at a streak milestone — visible to the Circle.

> This is the whole game in the no-mascot version: accountability from people you chose does the emotional work the companion did — and arguably harder.

### Stage 3 — Week 2–4 (visible self-transformation + economy)
**Goal: long-term return reasons rooted in identity and reward.**
- The **profile becomes the trophy case**: longest streaks, badge shelf, total habits proven, time active. *This* is the thing that visibly grows.
- **Points ledger** matures → first **marketplace redemption** (brand-funded) feels earned.
- Custom habits introduced now (user has trust + context to design their own).
- **Progress story (the visible-growth substitute):** a real V1 surface — a personal "you've come this far" view (e.g. "21 days of movement": streak chart, total proofs, longest streak, badges earned). This is the no-mascot replacement for watching a pet grow, so it ships in V1, not as a maybe. (Powered by the `milestones` table — `IMPLEMENTATION-PLAN.md`.)

### Stage 4 — Month 2+ (identity + surprise)
**Goal: from "an app I use" to "who I am.")**
- Deep streaks + a full badge shelf + an active Circle = sunk emotional + social investment.
- **Surprise & delight** layer (Finch's "adventures" equivalent, mascot-free): Circle milestones, seasonal challenges, streak-anniversary moments, group goals. Invest here once the core loop is proven.
- **Re-engagement (concrete triggers):** after N days inactive (off last-completion date), send an encouraging push — "your Circle missed you" when they're in an active pod, or a gentle solo nudge otherwise. Copy is warm, never guilt-based. (Notification set defined in `IMPLEMENTATION-PLAN.md` Phase 3.)

---

## The core daily loop (one sentence)

> Nudge → capture proof → **streak + points tick up, instantly and satisfyingly** → Circle cheers → tomorrow you show up for your people and for the version of you you're building.

---

## What separates "habit tracker" from "Finch level" — build priorities (no-mascot)

1. **The Circle is the product, not a feature.** Reactivity between members — cheers, seeing proofs, the shared moment — must feel alive and low-friction. This carries the emotional load the pet would have. Budget real design time here.
2. **Make personal progress visceral.** Streaks, badges, and the profile "trophy case" are the thing that visibly grows. Invest in making them feel earned and beautiful (see `DESIGN-SPEC.md`).
3. **Gentleness lives in copy + pacing.** With no character to emote, tone is the warmth. No shaming. Misses are recoverable and kind everywhere.
4. **The first win must land.** Onboarding success = "proved 1 habit on day 0," with a satisfying confirmation — not a tour.
5. **Social re-engagement over guilt.** Lean on "your Circle is here," not nags.
6. **Surprise layer is a real roadmap line.** Schedule it right after the core loop stabilizes — it's what turns retention into love.

---

## Mapping features → journey stages

| Feature (PRD) | Where it earns its keep |
|---|---|
| Google sign-in | Stage 0 — zero-friction entry |
| Onboarding | Stage 0 — the first-win moment |
| Habits (library) | Stage 0–1 — instant first win |
| Habits (custom) | Stage 3 — once trust is built |
| Proof + BeReal | Stage 1 — the daily ritual |
| Streaks | Stage 1–4 — momentum + the "growing" self |
| Circle | Stage 2 — **primary engagement engine** |
| Avatar (profile) | Stage 0+ — identity, not a companion |
| Badges | Stage 2–3 — visible transformation |
| Marketplace | Stage 3 — earned reward |
| Points ledger | All stages — invisible spine |

---

## Open questions this journey raises (for §9 of the PRD)

- **Shared vs per-user BeReal window?** A shared circle moment is a much stronger ritual — and without a pet, ritual matters more.
- **Miss/grace rules?** Gentleness is now a copy/UX requirement carrying real retention weight.
- **How much "surprise & delight" makes V1?** With no companion adventures, the Circle/seasonal layer is the main delight source — at minimum design the hooks so it can be added without rework.
- **Progress-story surfacing?** Worth deciding whether a personal "you've come this far" view ships in V1 as the visible-growth substitute for a pet.
