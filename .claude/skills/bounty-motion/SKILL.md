---
name: bounty-motion
description: Build beautiful, high-fps React Native UI and motion for the Bounty app. Use whenever creating or animating screens, components, transitions, celebrations (the award/first-win moment, streak ticks, milestones), haptics, or empty states. Encodes the motion tokens, haptic patterns, and reward choreography from docs/DESIGN-SPEC.md and the visual tokens from docs/DESIGN-SYSTEM.md.
---

# Bounty — beautiful RN motion & UI

Build to the project's own design language, not generic AI defaults. The two source-of-truth docs override anything here if they diverge: `docs/DESIGN-SYSTEM.md` (color/type/radius/spacing tokens) and `docs/DESIGN-SPEC.md` (motion, celebration, haptics, voice, a11y).

## Stack (what to reach for)

- **Animation:** `react-native-reanimated` (v4) + `react-native-worklets` — already installed. Drive all continuous/interactive motion here, on the UI thread.
- **One-shot bursts** (confetti/sparkle/star cascade): **Lottie**. ⚠️ `lottie-react-native` is NOT yet a dependency — install it before building celebration bursts (`npx expo install lottie-react-native`).
- **Haptics:** `expo-haptics` (installed). Pair every reward with a haptic.
- **Gesture:** `react-native-gesture-handler` (installed).
- **iOS texture:** `expo-glass-effect`, `expo-symbols` (installed) — use for tactile depth, not gratuitously.
- **Styling:** NativeWind 4. There is no `tailwind.config.js` yet — generate it from `docs/DESIGN-SYSTEM.md` tokens before styling.

## Brand lock (do NOT "fix" this)

Dark-first, near-black navy (`#0E0E16`, never pure black) + a **single violet accent** (`#8B5CF6`), no mascot. The `frontend-design` skill warns against "purple gradients" — that warning does NOT apply here: violet-on-dark is the intentional, documented brand. Keep one confident accent; everything else neutral. Selection = full fill + glow, never a timid highlight.

## Motion tokens (define once, reuse — never one-off durations)

| Token | Value | Use |
|---|---|---|
| `spring-soft` | damping 18, stiffness 90 | screen/sheet transitions, card entrances |
| `spring-pop` | damping 12, stiffness 140 | selection, chip fill, the award count-up |
| `ease-screen` | `cubic-bezier(.22,1,.36,1)`, ~360ms | screen-in slide+fade |
| `ease-pop` | `cubic-bezier(.34,1.56,.64,1)` | celebratory pop-in (slight overshoot) |
| idle loops | ≥3s, low amplitude | ambient (glow pulse on a live streak) |
| celebrations | <800ms | one-shot reward moments |

**Principle: idle is slow, reward is fast.** Put these in a shared `motion` constants module and import them; do not scatter literals.

## Haptic patterns (via expo-haptics)

| Name | Pattern | Trigger |
|---|---|---|
| `haptic-tap` | light impact | selection, chip toggle |
| `haptic-success` | success notification | habit complete, redemption |
| `haptic-milestone` | success + short double pulse | streak milestone / badge |
| `haptic-warn` | warning notification | BeReal window closing (sparingly) |

Respect silent mode and reduced-motion.

## The hero: award / first-win moment (Phase 1, the emotional core)

On habit completion, choreograph in order:
1. **Points count-up** — earned delta animates into the balance (`spring-pop`), Display number.
2. **Streak tick** — streak increments with a `streak`-orange (`#FB923C`) flame + soft glow; if 7/30/100, escalate to milestone (star cascade + `haptic-milestone`).
3. **Confirmation burst** — brief violet/`success` confetti or sparkle (Lottie), <800ms, then settle.
4. **Copy** — crisp, earned (“You did it. Day 1.”). Momentum framing, never a tour.
5. **Haptic** — `haptic-success` on the SAME frame as the burst.

**Must hit 60fps on mid-range Android — profile from Phase 1, not at polish.** Keep animations on the UI thread (Reanimated worklets); never animate via React state in a hot path.

## Other celebration moments

- **Streak milestone (7/30/100):** larger one-shot (star cascade) + badge reveal + `haptic-milestone`; visible in profile + Circle feed.
- **Badge earned:** badge animates onto the shelf (`ease-pop`).
- **Reward redemption:** present as an event (card flip-in + `haptic-success`) — earned, not a form submit.
- **Cheer received (Circle):** lightweight pop + subtle haptic; never noisy.

## Empty states & tone (no-mascot warmth)

No mascot, so warmth lives in copy, pacing, and tactile "clay" illustration. A Circle of one and a fresh feed must feel inviting, not barren. **Miss handling is never red/shaming** — use neutral/`text-secondary`; keep `danger` (`#F87171`) rare and only for truly destructive actions.

## Accessibility

- Honor `prefers-reduced-motion` / Reduce Motion: swap big celebrations for a calm fade + the haptic; kill idle loops.
- Maintain contrast against the dark canvas using the documented `text-*` tokens.
- Don't gate meaning on color alone (streak alive = flame + label, not just orange).

## Checklist before calling RN UI "done"

- [ ] Tokens imported, no magic durations/colors
- [ ] Reward paired with the correct haptic, same-frame
- [ ] Reduced-motion path exists
- [ ] Animations run on UI thread (Reanimated), profiled ≥~60fps
- [ ] Matches `DESIGN-SYSTEM.md` tokens and dark-violet brand
