# Colour Palette — UI Design System

Three-colour system built on Orange, Jet, and Moonstone. Covers all surfaces, accents, and typography for dark and light mode.

---

## Core colours

### Orange — Primary accent
| Stop | Hex | Usage |
|------|-----|-------|
| 50 | `#FEF2EA` | Tinted backgrounds, alert fills |
| 100 | `#FDDBC4` | High-priority badge bg (light mode) |
| 200 | `#FAC09A` | Hover tints on orange elements |
| **400** | **`#EE6C29`** | **CTA buttons, active nav, pipeline bars (proposal/negotiation), notification dot** |
| 500 | `#D45A1E` | CTA buttons (light mode), pressed state |
| 700 | `#8F3C12` | Text on orange-tinted backgrounds |

### Jet — Base surface
| Stop | Hex | Usage |
|------|-----|-------|
| 100 | `#505555` | Borders, dividers |
| 200 | `#3D4141` | Card hover state |
| 300 | `#323636` | Card surface |
| **400** | **`#282B2B`** | **Main background, sidebar, topbar** |
| 500 | `#1E2020` | Deeper sidebar wells |
| 600 | `#141616` | Absolute darkest surfaces |

### Moonstone — Secondary accent
| Stop | Hex | Usage |
|------|-----|-------|
| 50 | `#EAF3F6` | Hover bg (light mode), subtle tints |
| 100 | `#C4DDE5` | Qualifier badge bg (light mode) |
| 200 | `#9EC6D1` | Light mode focus rings, secondary fills |
| **400** | **`#7AA6B3`** | **Lead/qualifier stage bars, focus rings (dark), link actions, low-priority badges, KPI icon tint** |
| 500 | `#5F8F9D` | Secondary accent (light mode) |
| 700 | `#3A6370` | Text on Moonstone-tinted backgrounds |

---

## Mode tokens

### Dark mode
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#282B2B` | App background, sidebar, topbar |
| `bg-card` | `#323636` | Card surface |
| `bg-hover` | `#3D4141` | Hover state on cards and nav items |
| `accent-primary` | `#EE6C29` | CTA buttons, active states, badges |
| `accent-secondary` | `#7AA6B3` | Links, focus rings, secondary badges |
| `text-primary` | `#F2F4F4` | Body copy, headings |
| `text-secondary` | `#D4DADA` | Labels, subtitles |
| `text-muted` | `#8FA5A5` | Placeholder, supporting text |
| `text-hint` | `#607070` | Disabled, meta text |
| `border-default` | `rgba(255,255,255,0.08)` | Card borders, dividers |
| `border-emphasis` | `rgba(255,255,255,0.15)` | Focused inputs, active borders |

### Light mode
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#F5F7F7` | App background (Moonstone-tinted, not pure white) |
| `bg-card` | `#FFFFFF` | Card surface |
| `bg-hover` | `#EAF3F6` | Hover state (Moonstone 50) |
| `accent-primary` | `#D45A1E` | CTA buttons, active states (stepped down for contrast) |
| `accent-secondary` | `#5F8F9D` | Links, focus rings, secondary badges |
| `text-primary` | `#1A1D1D` | Body copy, headings |
| `text-secondary` | `#3D4141` | Labels, subtitles |
| `text-muted` | `#6B7070` | Placeholder, supporting text |
| `text-hint` | `#9AA0A0` | Disabled, meta text |
| `border-default` | `rgba(0,0,0,0.08)` | Dividers, section rules |
| `border-card` | `rgba(0,0,0,0.08)` | Card resting border (0.5px) |
| `border-card-hover` | `rgba(0,0,0,0.14)` | Card hover border (0.5px) — tightens without bg change |
| `border-emphasis` | `rgba(0,0,0,0.15)` | Focused inputs, active borders |

---

## Typography neutrals

Neutral text tones are Moonstone-tinted rather than cold grey, keeping all four tones within the palette's hue family.

| Role | Dark mode | Light mode |
|------|-----------|------------|
| Primary | `#F2F4F4` | `#1A1D1D` |
| Secondary | `#D4DADA` | `#3D4141` |
| Muted | `#8FA5A5` | `#6B7070` |
| Hint | `#607070` | `#9AA0A0` |

---

## Component usage

### Badges
| Variant | Background | Text |
|---------|-----------|------|
| High priority (dark) | `#EE6C29` | `#FFFFFF` |
| High priority (light) | `#FDDBC4` | `#8F3C12` |
| Low priority / qualifier (dark) | `rgba(122,166,179,0.15)` | `#9EC6D1` |
| Low priority / qualifier (light) | `#C4DDE5` | `#3A6370` |
| Neutral (dark) | `#3D4141` | `#D4DADA` |
| Neutral (light) | `rgba(0,0,0,0.06)` | `#3D4141` |

### Pipeline bars
| Stage | Colour |
|-------|--------|
| Proposal | `#EE6C29` |
| Negotiation | `#D45A1E` |
| Lead | `#7AA6B3` |
| Qualifier | `#9EC6D1` |
| Closed / inactive | `#3D4141` |

### Interactive elements
- **CTA button (dark):** bg `#EE6C29`, text `#FFFFFF`, hover `#D45A1E`
- **CTA button (light):** bg `#D45A1E`, text `#FFFFFF`, hover `#8F3C12`
- **Focus ring:** `#7AA6B3` (dark) / `#5F8F9D` (light), 2px solid
- **Active nav item:** bg `rgba(238,108,41,0.12)`, left border `#EE6C29`, text `#EE6C29`
- **Notification dot:** `#EE6C29`
- **Activity indicator:** `#EE6C29`

---

## Design notes

**Accent contrast shift.** Orange steps from `#EE6C29` (dark) to `#D45A1E` (light) to maintain WCAG AA contrast on white surfaces. Moonstone follows the same logic: `#7AA6B3` → `#5F8F9D`.

**Light mode base is not white.** Page background is `#F5F7F7` — a Moonstone-tinted near-white — so white cards feel elevated without shadows.

**Light mode hover uses Moonstone 50.** `#EAF3F6` on hover keeps interactive surfaces consistent with the secondary accent rather than introducing an unrelated grey.

**Light mode cards use border for definition, not shadow.** `bg-card` (#FFFFFF) and `bg-base` (#F5F7F7) are close in value, so a 0.5px `border-card` token at `rgba(0,0,0,0.08)` provides the separation. On hover, the border steps to `rgba(0,0,0,0.14)` — tighter, not heavier. No box-shadows needed.

**Neutrals are hue-matched.** All text tones lean toward Moonstone's hue (`8FA5A5`, `607070`) rather than a cold neutral, keeping the palette coherent.
