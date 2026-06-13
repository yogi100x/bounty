# Bounty — Design Spec (Motion, Moments, Voice, Accessibility)

**Date:** 2026-06-13
**Scope:** The *feel* layer — motion, celebration moments, haptics, voice/copy, empty states, accessibility, and illustration direction.
**Tokens live in** `docs/DESIGN-SYSTEM.md` (colors, type, radius, spacing) — this doc never redefines them.
**Brand lock:** Bounty is **dark-first, near-black navy + a single violet accent**, no companion character.

> **Important:** this spec deliberately *supersedes* the source `karmic_pwa` `DESIGN-SPEC.md` and `ILLUSTRATION-BRIEF.md`. Ignore their “Sunny Companion” light-sky palette, the Karmi cat, and the mystical/lotus illustration direction — they fight Bounty’s palette. Follow `docs/DESIGN-SYSTEM.md` for all visual decisions.

---

## 1. Motion language (tokens, not one-offs)

Motion is calm by default, decisive on reward. Define these once and reuse:

| Token | Value | Use |
|---|---|---|
| `spring-soft` | damping 18, stiffness 90 | screen/sheet transitions, card entrances |
| `spring-pop` | damping 12, stiffness 140 | selection, chip fill, the award count-up |
| `ease-screen` | `cubic-bezier(.22,1,.36,1)`, ~360ms | screen-in slide+fade |
| `ease-pop` | `cubic-bezier(.34,1.56,.64,1)` | pop-in of celebratory elements (slight overshoot) |
| idle loops | ≥3s, low amplitude | ambient (glow pulse on a live streak) |
| celebrations | <800ms, fast | one-shot reward moments |

Principle: **idle is slow, reward is fast.** Built with Reanimated; one-shot bursts (confetti/sparkle) via Lottie. Every celebration is paired with a haptic (§4).

## 2. The award / first-win moment (the hero)

This is the emotional core of the app (journey Stage 0–1) and is built in **Phase 1**. On completing a habit:

1. **Points count-up** — the earned delta animates up into the balance (`spring-pop`), in Clash Display (Display number).
2. **Streak tick** — the streak number increments with a `streak`-orange flame accent + soft glow; if a milestone (7/30/100) is hit, escalate to the milestone celebration (§3).
3. **Confirmation burst** — a brief violet/`success` confetti or sparkle (Lottie), <800ms, then settle.
4. **Copy** — a crisp, earned line (“You did it. Day 1.”) — momentum framing, never a tour.
5. **Haptic** — `haptic-success` (§4) on the same frame as the burst.

The moment must hit **60fps on mid-range Android** — profile it from Phase 1, not at polish.

## 3. Other celebration moments

- **Streak milestone (7/30/100):** larger one-shot (star cascade), badge reveal, `haptic-milestone`. Visible in profile + Circle feed.
- **Badge earned:** badge animates onto the shelf (`ease-pop`).
- **Reward redemption:** the reward is *presented* as an event (card flip-in + `haptic-success`) — redemption should feel earned, not like a form submit.
- **Cheer received (Circle):** lightweight pop + subtle haptic; never noisy.

## 4. Haptics (named patterns)

Pair every reward with a haptic via `expo-haptics`; respect silent mode and reduced-motion.

| Name | Pattern | Trigger |
|---|---|---|
| `haptic-tap` | light impact | selection, chip toggle |
| `haptic-success` | success notification | habit complete, redemption |
| `haptic-milestone` | success + short double pulse | streak milestone / badge |
| `haptic-warn` | warning notification | BeReal window closing (sparingly) |

*(Optional sound palette — 4–6 short cues paired with haptics — is a fast-follow, not V1-blocking.)*

## 5. Voice & copy

- **Warm second person, short sentences, zero guilt.** Bounty’s own voice — no mascot persona.
- **No shaming, ever.** A miss reads “not yet today” / “pick up where you left off,” never “you failed,” never red. (Misses use neutral/`text-secondary`.)
- **Circle privacy framing** where proof is shared: be explicit about who sees a proof (“Shared with your Circle”) at capture time.
- **Re-engagement** leans on people, not guilt: “your Circle is here,” not nags.

## 6. Empty states (warmth lives here)

With no mascot to carry charm, empty states do the emotional work — design them as first-class screens, not afterthoughts:

- **Today, nothing due / all done:** a calm “you’re clear for today” with the streak still visible — reward, not void.
- **Circle of one / fresh feed:** inviting, not barren — a soft clay illustration + a clear “invite a friend” action; frame waiting as anticipation.
- **Rewards, nothing affordable yet:** show progress toward the nearest reward (points-to-go), not a blank shelf.
- **Profile, early:** the trophy case seeds the first badge slot as “next up,” so growth feels imminent.

## 7. Accessibility (built-in, not a polish pass)

- **Dynamic Type / font scaling** — layouts reflow; never clip at large sizes.
- **VoiceOver / TalkBack** on the entire core loop (onboarding → complete → proof → award).
- **Reduced-motion variants** of every celebration (§2–3): cross-fade/instant instead of bursts; honor the OS setting.
- **Contrast:** verify text tokens on dark surfaces meet WCAG AA.
- Profile animated screens on **mid-range Android**.

## 8. Illustration & iconography direction

Follow `DESIGN-SYSTEM.md` §6 — restated here so asset sourcing stays on-brand:

- **Soft 3D “clay” objects/scenes** (pastel, blush highlights, single light source) for onboarding, empty states, celebration. Abstract objects — **no recurring character.**
- Keep the **violet/lavender family** so art sits on the dark navy canvas. **No sunny-sky / light backgrounds, no purple-vs-sky conflict from the source brief.**
- **Icons:** rounded line icons (Lucide/Phosphor), ~1.75px stroke, `text-secondary` default / `violet-400` active. No emoji-as-icons; no decorative icon on every row.
- **AI-generated assets** must be generated against the DESIGN-SYSTEM hexes and rejected if off-palette.

## 9. Performance budget

- Award moment + all celebrations: **60fps on mid-range Android.**
- Profile Reanimated thread health and Lottie file sizes on cheap hardware *during* Phase 1–3, not after.
