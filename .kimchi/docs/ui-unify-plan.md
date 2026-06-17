# UI Unification Plan: Match Landing Page Card Style

## Goal
Update the Dashboard, Profile, Consent Generator, and History pages so their card styling matches the landing page aesthetic. Fix header padding on both the app layout mobile header and the page section headers. Convert all inline/arbitrary text sizes on those pages to standard Tailwind utilities.

## Context
- Landing page (`app/page.tsx`) uses clean white cards with `rounded-2xl`, subtle borders, and soft shadows.
- Inner pages (`app/(app)/*`) share a layout with a desktop sidebar + mobile floating header.
- The `.card` / `.nq-card` CSS component currently uses `border-radius: var(--radius)` (0.375rem ≈ `rounded-md`), while the landing page's hero cards use explicit `rounded-2xl`.
- The only arbitrary Tailwind text sizes in the target pages are `text-[10px]` consent-type badges in Dashboard and History.
- Sidebar has `text-[16px]` (logo) and `text-[10px]` (mobile nav labels).

## Changes by File

### Shared Foundation (Phase 1)
| File | Change |
|------|--------|
| `app/globals.css` — `.card` | Change `border-radius: var(--radius)` → `border-radius: 1rem` (makes all `.card` / `.nq-card` elements `rounded-2xl`) |
| `app/(app)/layout.tsx` — mobile header | Tighten padding from `px-4 py-3` to `px-3 py-2` to match landing page pill navbar proportions |
| `components/Sidebar.tsx` — logo text | `text-[16px]` → `text-base` |
| `components/SidebarNav.tsx` — mobile labels | `text-[10px]` → `text-xs` |

### Dashboard + History (Phase 2)
| File | Change |
|------|--------|
| `app/(app)/dashboard/page.tsx` | Tighten page header padding (`pb-6 mb-8` → `pb-4 mb-6`). Convert `text-[10px]` badge → `text-xs` |
| `app/(app)/history/page.tsx` | Same header padding fix. Convert `text-[10px]` badge → `text-xs` |

### Profile + Generate (Phase 3)
| File | Change |
|------|--------|
| `app/(app)/profile/page.tsx` | Tighten page header padding (`pb-6 mb-8` → `pb-4 mb-6`) |
| `app/(app)/generate/page.tsx` | Tighten page header padding (`pb-6 mb-8` → `pb-4 mb-6`). Cards inside `ConsentForm`, `ResearchConsentForm`, and `ConsentDocument` are fixed automatically by the Phase 1 `.card` change |

## Verification
- `npm run build` must exit 0 after each phase.
- `grep -r "text-\[" app/\(app\)/dashboard/page.tsx app/\(app\)/history/page.tsx app/\(app\)/profile/page.tsx app/\(app\)/generate/page.tsx components/Sidebar.tsx components/SidebarNav.tsx` must return empty (no arbitrary text sizes).
