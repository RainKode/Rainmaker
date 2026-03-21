---
description: Apply these rules whenever a UI component, page, layout, or visual element is being created or modified in the Rainmaker project.
applyTo: "**/*.tsx,**/*.jsx,**/*.css,**/components/**,**/app/**"
---

# Rainmaker — UI Design System Rules

> **MANDATORY**: Before building any UI component, read `.github/skills/ui/SKILL.md` in full and apply its priority 1–10 rule categories to every decision. These project-level rules override or extend that skill where specified.

---

## 0 — Invoke the UI Skill First

Every time a UI component, page, or layout is created or modified:

1. Load and apply `.github/skills/ui/SKILL.md` rules (priority 1 → 10).
2. Then apply the Rainmaker brand rules below.
3. The brand rules always win when there is a conflict.
4. **Colour check — MANDATORY**: Before touching any colour value, open and read `.github/instructions/colour-palette.md`. **No new colour may be introduced — ever — without first confirming it exists in that file. This is a hard rule with zero exceptions.**

---

## 1 — Brand Philosophy

**Minimal above all.** Every element must earn its place.

- Remove decorative elements that carry no information.
- Prefer whitespace over additional UI chrome.
- Flat style everywhere — **no shadows ever** (neither dark nor light mode). Dark mode: card elevation via luminosity steps. Light mode: card definition via a 0.5px `border-card` token — the border tightens on hover, it does not become heavier.
- Rounded corners on all interactive elements (buttons: `rounded-full`; cards/inputs: `rounded-xl`).
- Typography must be easy to read at a glance — generous line-height, clear hierarchy.

---

## 2 — Typography

**Font family: Satoshi** (loaded via `@fontsource/satoshi` or the Fontshare CDN).

```css
font-family: 'Satoshi', sans-serif;
```

| Role | Weight | Size (desktop) | Line-height |
|------|--------|----------------|-------------|
| Heading 1 | 700 | 2rem | 1.2 |
| Heading 2 | 700 | 1.5rem | 1.25 |
| Heading 3 | 600 | 1.25rem | 1.3 |
| Body | 400 | 1rem (16px) | 1.6 |
| Label / Caption | 500 | 0.875rem | 1.4 |
| Hint / Meta | 400 | 0.75rem | 1.4 |

**Dark mode text rule:** never use pure white. Use the opacity/token hierarchy below:

| Emphasis | Token | Dark hex |
|----------|-------|----------|
| High (87%) | `text-primary` | `#F2F4F4` |
| Medium (60%) | `text-secondary` | `#D4DADA` |
| Low (38%) | `text-muted` | `#8FA5A5` |
| Disabled | `text-hint` | `#607070` |

Use lighter font weights in dark mode (body: 400, not 500) to counteract the bold-appearance effect of light-on-dark.

---

## 3 — Colour Palette (Non-negotiable)

> ### ⛔ COLOUR RULE — NO EXCEPTIONS
> **Every time you work with colour — any colour, anywhere — you MUST open and read `.github/instructions/colour-palette.md` first.**
> No new hex value, Tailwind colour class, CSS variable, or named colour may be introduced unless it already exists in that file.
> This applies to every component, every state, every interaction, every mode — dark and light.
> **There are no exceptions. If the colour is not in `colour-palette.md`, it cannot be used.**

Only these colours may appear in the UI. No other hex values, no Tailwind default palette colours except as mapped below. **No deviations.**

### Core Palette

#### Orange — Primary accent
| Stop | Hex |
|------|-----|
| 50 | `#FEF2EA` |
| 100 | `#FDDBC4` |
| 200 | `#FAC09A` |
| **400** | **`#EE6C29`** ← CTA, active nav, notification dot |
| 500 | `#D45A1E` ← light mode CTA, pressed state |
| 700 | `#8F3C12` ← text on orange-tinted bg |

#### Jet — Base surface
| Stop | Hex |
|------|-----|
| 100 | `#505555` ← borders, dividers |
| 200 | `#3D4141` ← card hover |
| 300 | `#323636` ← card surface |
| **400** | **`#282B2B`** ← main bg, sidebar, topbar |
| 500 | `#1E2020` ← deeper sidebar wells |
| 600 | `#141616` ← absolute darkest |

#### Moonstone — Secondary accent
| Stop | Hex |
|------|-----|
| 50 | `#EAF3F6` |
| 100 | `#C4DDE5` |
| 200 | `#9EC6D1` |
| **400** | **`#7AA6B3`** ← links, focus rings (dark), secondary badges |
| 500 | `#5F8F9D` ← secondary accent (light mode) |
| 700 | `#3A6370` ← text on Moonstone-tinted bg |

---

### Design Tokens

#### Dark Mode
| Token | Value |
|-------|-------|
| `--bg-base` | `#282B2B` |
| `--bg-card` | `#323636` |
| `--bg-hover` | `#3D4141` |
| `--accent-primary` | `#EE6C29` |
| `--accent-secondary` | `#7AA6B3` |
| `--text-primary` | `#F2F4F4` |
| `--text-secondary` | `#D4DADA` |
| `--text-muted` | `#8FA5A5` |
| `--text-hint` | `#607070` |
| `--border-default` | `rgba(255,255,255,0.08)` |
| `--border-emphasis` | `rgba(255,255,255,0.15)` |

#### Light Mode
| Token | Value |
|-------|-------|
| `--bg-base` | `#F5F7F7` |
| `--bg-card` | `#FFFFFF` |
| `--bg-hover` | `#EAF3F6` |
| `--accent-primary` | `#D45A1E` |
| `--accent-secondary` | `#5F8F9D` |
| `--text-primary` | `#1A1D1D` |
| `--text-secondary` | `#3D4141` |
| `--text-muted` | `#6B7070` |
| `--text-hint` | `#9AA0A0` |
| `--border-default` | `rgba(0,0,0,0.08)` |
| `--border-card` | `rgba(0,0,0,0.08)` |
| `--border-card-hover` | `rgba(0,0,0,0.14)` |
| `--border-emphasis` | `rgba(0,0,0,0.15)` |

---

## 4 — Component Brand Overrides (shadcn/ui + any other library)

When using shadcn/ui or any other component library, **always re-skin to the brand tokens**. Never ship default shadcn styles.

### Button
```tsx
// CTA / Primary — dark mode
className="bg-[#EE6C29] hover:bg-[#D45A1E] active:bg-[#8F3C12] text-white font-medium rounded-full px-5 py-2 transition-colors"

// CTA / Primary — light mode
className="bg-[#D45A1E] hover:bg-[#8F3C12] text-white font-medium rounded-full px-5 py-2 transition-colors"

// Secondary / Ghost
className="border border-[rgba(255,255,255,0.08)] text-[#D4DADA] hover:bg-[#3D4141] rounded-full px-5 py-2 transition-colors"
```
- All buttons: `rounded-full`, no box-shadow.
- Minimum touch target: 44×44 px.
- Focus ring: `outline-2 outline-offset-2 outline-[#7AA6B3]`.

### Card
```tsx
// Dark mode
className="bg-[#323636] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 transition-colors"
// hover (dark):
className="hover:bg-[#3D4141] hover:border-[rgba(255,255,255,0.12)]"

// Light mode
className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5 transition-colors" // 0.5px border
// hover (light): border tightens — background stays white
className="hover:border-[rgba(0,0,0,0.14)]"
```
No `shadow-*` in either mode. Dark: elevation = lighter Jet stop. Light: elevation = 0.5px `border-card`; hover tightens border to `border-card-hover`, **background does not change**.

### Input / Textarea / Select
```tsx
className="bg-[#282B2B] border border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#7AA6B3] rounded-xl px-4 py-2.5 text-[#F2F4F4] placeholder:text-[#607070]"
```

### Badge
| Variant | bg | text |
|---------|----|------|
| High priority (dark) | `#EE6C29` | `#FFFFFF` |
| High priority (light) | `#FDDBC4` | `#8F3C12` |
| Low priority (dark) | `rgba(122,166,179,0.15)` | `#9EC6D1` |
| Low priority (light) | `#C4DDE5` | `#3A6370` |
| Neutral (dark) | `#3D4141` | `#D4DADA` |
| Neutral (light) | `rgba(0,0,0,0.06)` | `#3D4141` |

### Navigation — Active Item
```tsx
className="bg-[rgba(238,108,41,0.12)] border-l-2 border-[#EE6C29] text-[#EE6C29]"
```

### Focus Ring (global)
```css
:focus-visible {
  outline: 2px solid #7AA6B3; /* dark */
  outline-offset: 2px;
}
```

### Pipeline / Progress Bars
| Stage | Colour |
|-------|--------|
| Proposal | `#EE6C29` |
| Negotiation | `#D45A1E` |
| Lead | `#7AA6B3` |
| Qualifier | `#9EC6D1` |
| Closed / inactive | `#3D4141` |

---

## 5 — 5 Rules of Perfect Design (Apply to Every Component)

1. **User-Centered Focus** — Design solves a real user need. No vanity UI.
2. **Simplicity & Clarity** — Every element has a purpose. Remove anything that doesn't.
3. **Consistency** — Same fonts, colours, corner radii, spacing scale throughout. No one-offs.
4. **Feedback & Interaction** — Every action has visible state feedback (loading, success, error). No silent mutations.
5. **Accessibility** — WCAG 2.1 AA minimum. Contrast ≥ 4.5:1, keyboard nav, aria-labels on icon buttons, `alt` on images.

---

## 6 — Dark UI Rules (Always Active)

- **No shadows — ever.** Neither `shadow-*` nor `drop-shadow` in dark or light mode.
- **Dark mode depth:** hierarchy via Jet luminosity steps — modal on `#323636` over page `#282B2B`.
- **Light mode depth:** `bg-card` (`#FFFFFF`) over `bg-base` (`#F5F7F7`) separated by a 0.5px `border-card` (`rgba(0,0,0,0.08)`). On hover, border steps to `rgba(0,0,0,0.14)` — tighter, not heavier. `bg-hover` (`#EAF3F6`) is reserved for **nav items and list rows**, not cards.
- **No pure white text.** Use `#F2F4F4` (87% emphasis) as the highest text level in dark mode.
- **Limit saturation.** Stay within Orange 200–500 and Moonstone 200–500 for accents. Never go beyond.
- **Allow theme switching.** Components must respect both dark and light token sets.

---

## 7 — Spacing & Layout

- Base unit: `4px` (Tailwind default spacing scale).
- Minimum touch/click target: `44×44px`.
- Card padding: `1.25rem` (20px) desktop, `1rem` (16px) mobile.
- Section gap: `1.5rem`–`2rem`.
- Responsive breakpoints: Mobile-first. `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`.
- No horizontal scroll on any viewport.

---



## 8 — Checklist Before Shipping Any Component

- [ ] Satoshi font applied
- [ ] Only palette hex values used — no Tailwind gray/blue/etc defaults
- [ ] `rounded-full` on buttons, `rounded-xl` on cards/inputs
- [ ] No `shadow-*` utilities in dark **or** light mode
- [ ] Focus ring is `#7AA6B3` at 2px
- [ ] Text uses token hierarchy (`text-primary` → `text-hint`)
- [ ] Minimum 44×44px touch targets
- [ ] Keyboard navigable + aria-labels on icon-only controls
- [ ] Light mode tokens applied under `.light` / `[data-theme="light"]`
- [ ] Loading / error / empty states implemented
- [ ] **Colour audit**: every colour value in this component was verified against `.github/instructions/colour-palette.md` before use — no new colours introduced, no exceptions