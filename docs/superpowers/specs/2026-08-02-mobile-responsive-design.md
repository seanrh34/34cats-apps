# Mobile Responsive UI Design

**Date:** 2026-08-02  
**Status:** Approved for implementation

## Goal

Make the complete 34cats Apps web app usable from 320px phone widths through
tablet and desktop widths, in portrait and landscape orientations, while
preserving the current visual system, content, routes, and interactions.

## Scope

The responsive pass covers every user-facing route and shared surface:

- Homepage (`/`) and its hero, app cards, about section, and closing CTA.
- PawPress CMS write-up (`/pawpress-cms`) and its project hero, content grids,
  workflow list, comparison lists, and final CTA.
- Sign-in (`/login`), including loading, error, and button states.
- Privacy policy and terms pages through the shared legal document shell.
- Sticky navbar, mobile navigation menu, theme control, authentication actions,
  and footer.

The pass does not change copy, data, links, auth behavior, image assets,
colors, typography family, interaction model, or routes. Existing in-progress
visual work remains the source of truth.

## Responsive strategy

Use the existing Tailwind CSS v4 utilities and responsive variants. Keep the
current desktop composition as the large-screen expression, then add fluid and
stacked behavior where the content needs it:

- Use arbitrary `clamp()` values for prominent headings and spacing where a
  fluid scale prevents abrupt jumps between breakpoints.
- Use the existing `sm`, `md`, and `lg` variants for layout transitions. The
  base layout must remain valid at 320px; no mobile-only duplicate markup is
  introduced.
- Keep page gutters fluid but bounded, using utilities such as
  `px-[clamp(...)]` where needed, while retaining the current max-width
  containers.
- Use `min-w-0`, `break-words`, `overflow-wrap`-safe text behavior, and
  wrapping flex/grid tracks for long emails, URLs, technology labels, and legal
  content.
- Keep all meaningful content in DOM order. Multi-column layouts collapse to a
  single readable column before they become cramped.

## Surface rules

### Navigation

The existing desktop nav remains horizontal at `md` and above. On smaller
widths, the current Menu/Close disclosure remains the interaction model, with
the logo able to shrink without pushing controls off-screen. Menu rows, theme
toggle, auth actions, and credits retain at least 44px touch targets and use
full-width or two-column actions only where the available width supports it.

### Homepage

The hero stays centered, but its heading and copy use fluid sizes and safe line
breaking. Primary and secondary actions fill the available mobile width and
return to their existing inline layout from `sm` upward. App cards stay one per
row until the existing two-column layout has enough room; status and technology
metadata wrap without horizontal overflow. About links remain stacked on very
narrow screens and use the existing two-column label/value treatment from
`sm` upward. Footer groups stack naturally and the copyright row wraps.

### PawPress page

The project hero and all two-column sections collapse to one column before
content becomes narrow. Headings and paragraphs use fluid sizes with readable
line lengths. CTA buttons become full-width on phones and return to the
existing inline layout at `sm`/`lg`. Outcome, good-fit, and prerequisite grids
retain their current borders and order while stacking cleanly. The screenshot
remains responsive and capped by its containing panel.

### Sign-in and legal pages

The sign-in panel remains centered and full-width within mobile gutters, with
comfortable vertical padding and a 44px Google button. Legal content remains a
single readable column, with long links and contact details wrapping rather
than causing viewport overflow. Heading sizes and section spacing become
fluid only where needed to preserve the existing hierarchy.

### Global mobile behavior

Add viewport-safe handling through the existing layout metadata/CSS where
appropriate, preserve the `20rem` minimum body width, and avoid horizontal
scrollbars at 320px. Keep focus rings, reduced-motion behavior, color themes,
hover states, and native semantics intact. Do not hide core functionality on
mobile.

## Verification

Verify the implementation with:

1. `npm run lint`.
2. `npm run build`.
3. Browser checks at 320px, 375px, 768px, 1024px, and a wide desktop width,
   including portrait and landscape-like aspect ratios.
4. Route checks for `/`, `/pawpress-cms`, `/login`, `/privacy-policy`, and
   `/terms-of-service`.
5. Interaction checks for the mobile nav disclosure, theme toggle, auth action
   states, all primary links, and keyboard focus visibility.

## Constraints

- Tailwind utility classes and existing design tokens are preferred over new
  bespoke CSS.
- No functionality or content changes.
- No new dependencies.
- Preserve unrelated user work and keep the diff limited to responsive layout
  improvements plus this design/implementation documentation.
