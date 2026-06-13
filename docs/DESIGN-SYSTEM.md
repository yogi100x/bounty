# Bounty — Design System

**Date:** 2026-06-13
**Derived from:** `docs/Bounty.webp` (Mood Journal reference)
**Stack:** Expo / React Native + NativeWind (Tailwind). Tokens below are written to drop into `tailwind.config.js`.
**Related:** `docs/PRD-V1-no-mascot.md`, `docs/USER-JOURNEY-V1-no-mascot.md`, `docs/DESIGN-SPEC.md`, `docs/IMPLEMENTATION-PLAN.md`

---

## 1. Design Principles (read from the reference)

1. **Dark-first, calm.** Near-black navy canvas, never pure black. Content floats on soft elevated cards. Low-glare, evening-friendly — fits a daily check-in ritual.
2. **One confident accent.** Violet does all the "this is selected / this matters" work. Everything else is neutral. Restraint = clarity.
3. **Soft geometry.** Big radii, pill chips, rounded cards. Nothing sharp. Friendly without being childish.
4. **Bold display, quiet body.** Heavy grotesk headlines carry personality; body text stays clean and legible.
5. **Tactile illustration.** Soft 3D "clay" objects (pastel, blush highlights) for empty states, onboarding, celebration — the warmth layer (the no-mascot variant leans on these instead of a character).
6. **State you can feel.** Selection isn't a subtle highlight — it's a full fill + glow. Habits proven, chips chosen, streaks alive should read instantly.

---

## 2. Color Tokens

### Brand / Accent
| Token | Hex | Use |
|---|---|---|
| `violet-500` | `#8B5CF6` | Primary accent, selected stroke/text |
| `violet-400` | `#A78BFA` | Hover/pressed accent, glow |
| `violet-300` | `#C4B5FD` | Accent text on dark |
| `violet-tint` | `#8B5CF6` @ 14% | Selected chip fill (translucent violet over dark) |
| `lavender-bg` | `#A6A7CE` | Marketing / hero backdrop only (not in-app) |

### Surfaces (dark canvas)
| Token | Hex | Use |
|---|---|---|
| `bg` | `#0E0E16` | App background (near-black navy) |
| `surface-1` | `#14141F` | Cards, sheets |
| `surface-2` | `#1C1C2A` | Raised card / input fill |
| `surface-3` | `#252536` | Pressed / hover surface |
| `border` | `#2E2E40` | Chip & card outlines, dividers |
| `border-strong` | `#3A3A50` | Emphasis dividers |

### Text
| Token | Hex | Use |
|---|---|---|
| `text-primary` | `#F5F4FB` | Headlines, primary copy |
| `text-secondary`| `#B9B9CC` | Labels, secondary |
| `text-muted` | `#6E6E85` | Placeholders, hints, timestamps |

### Semantic
| Token | Hex | Use |
|---|---|---|
| `success` | `#34D399` | Streak alive, proof confirmed |
| `warning` | `#FBBF24` | "Late"/expiring BeReal window, blush accent |
| `danger` | `#F87171` | Destructive (leave circle, delete) — used sparingly |
| `streak` | `#FB923C` | Streak flame / milestone highlight |

> **No-mascot note:** semantic colors carry tone instead of a character. Keep `danger` rare; miss-handling uses neutral/`text-secondary`, never red (per journey's "no shaming" rule).

---

## 3. Typography

**Display / headings:** a heavy geometric grotesk — recommend **Clash Display** or **Cal Sans** (closest to the reference's bold caps). Use for screen titles ("How are you feeling?", "Today"), hero numbers, streak counts.
**Body / UI:** **Inter** (or **Geist**) — chips, labels, inputs, paragraphs.

| Role | Font | Size / Line | Weight |
|---|---|---|---|
| Display XL (hero/celebration) | Clash Display | 40 / 44 | 700 |
| Title (screen title) | Clash Display | 28 / 34 | 600 |
| Heading (section) | Inter | 20 / 26 | 700 |
| Body | Inter | 16 / 24 | 400–500 |
| Label (chips, buttons) | Inter | 14 / 20 | 500–600 |
| Caption (timestamps, hints) | Inter | 12 / 16 | 400 |

Tracking: tight on display (`-0.02em`), normal on body.

---

## 4. Spacing, Radius, Elevation

**Spacing scale (4pt):** `2, 4, 8, 12, 16, 20, 24, 32, 40, 56`. Default screen padding `20`. Card padding `16–20`.

**Radius:**
| Token | px | Use |
|---|---|---|
| `radius-pill` | 999 | Chips, mood faces, segmented controls |
| `radius-lg` | 24 | Cards, sheets, inputs |
| `radius-md` | 16 | Buttons, list rows |
| `radius-sm` | 12 | Small tags, avatars |

**Elevation (dark):** depth comes from surface lightening + a subtle violet glow on accent elements, not heavy drop shadows.
- Card: `surface-1` + `1px border` (`border`).
- Selected chip: `violet-tint` fill + `1px violet-500` border + soft `violet-400` glow (`shadow: 0 0 16px rgba(167,139,250,0.25)`).

---

## 5. Core Components

### Chip / Tag (the signature element)
- **Default:** `surface-1` fill, `1px border`, `text-secondary`, `radius-pill`, padding `8×16`.
- **Selected:** `violet-tint` fill, `1px violet-500` border, `violet-300` text, soft glow.
- **Used for:** habit categories, "what's affecting your mood" tags, proof tags, circle filters.

### Mood / Rating face (proof & check-in)
- Round clay sphere, `64px`. **Unselected:** neutral gray clay. **Selected:** colored + blush (yellow/`warning`), subtle scale-up (1.1×) + glow.
- Reuse the same pattern for **streak milestone** and **reaction/cheer** in the circle feed.

### Buttons
- **Primary:** `violet-500` fill, `text-primary`, `radius-md`, `48px` height, bold label. Pressed → `violet-400`.
- **Secondary:** transparent, `1px border`, `text-primary`.
- **Ghost/text:** `violet-300` label, no fill.

### Cards & List rows
- `surface-1`, `radius-lg`, `1px border`, `16–20` padding. Habit row = icon chip + title + cadence caption + check/complete control.

### Inputs
- `surface-2` fill, `radius-lg`, `text-muted` placeholder ("How is your day going?"), `1px border`, focus → `violet-500` border.

### Bottom tab bar
- `surface-1` over `bg`, active tab = `violet-400` icon + label, inactive = `text-muted`. (Tabs: Today / Circle / Rewards / Profile.)

---

## 6. Illustration & Iconography

- **3D clay illustrations:** soft, pastel, blush-cheeked, single-light-source — for onboarding, empty states, celebration (streak hit, redemption). Lavender/violet family to stay on-brand. *(This is the warmth layer; in the no-mascot direction these are abstract objects/scenes, not a recurring character.)*
- **Icons:** rounded line icons (e.g. Lucide / Phosphor), `1.75px` stroke, `text-secondary` default / `violet-400` active. Avoid sharp filled glyphs.

---

## 7. Bounty Screen → System Mapping

| Screen (PRD) | Key components |
|---|---|
| Onboarding | Display title, clay illustration, chip multi-select (pick habits), primary button |
| Today | Title, habit list rows (cards), complete/proof control, streak badge |
| Proof / BeReal capture | Camera surface, mood/face selector pattern, tag chips, note input |
| Circle feed | Proof cards, member avatars, cheer (face/reaction) buttons |
| Rewards | Reward cards (catalog), badge grid (clay/illustrated), points balance hero number (Display XL) |
| Profile | Avatar, streak/longest stats, badge shelf, points ledger list rows |

---

## 8. `tailwind.config.js` Token Block (drop-in)

```js
// tailwind.config.js — NativeWind
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: '#0E0E16',
        surface: { 1: '#14141F', 2: '#1C1C2A', 3: '#252536' },
        border: { DEFAULT: '#2E2E40', strong: '#3A3A50' },
        violet: { 300: '#C4B5FD', 400: '#A78BFA', 500: '#8B5CF6' },
        lavender: '#A6A7CE',
        text: { primary: '#F5F4FB', secondary: '#B9B9CC', muted: '#6E6E85' },
        success: '#34D399',
        warning: '#FBBF24',
        danger:  '#F87171',
        streak:  '#FB923C',
      },
      borderRadius: { sm: '12px', md: '16px', lg: '24px', pill: '999px' },
      fontFamily: {
        display: ['ClashDisplay', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

## 9. Open Design Decisions

1. **Dark-only, or light theme too?** Reference is dark-first; light mode is extra scope.
2. **Display font license:** Clash Display (free, Fontshare) vs Cal Sans (free) vs a paid grotesk.
3. **Illustration source:** commission a clay set vs a consistent stock/3D-render pack — needs to feel cohesive across onboarding/empty/celebration.
4. **Accent flexibility:** single violet, or a small secondary (e.g. teal/`success`) for variety in the circle feed and rewards.
