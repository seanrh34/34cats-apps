# Mobile Responsive UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every 34cats Apps route usable from 320px phones through tablet and desktop widths without changing existing functionality, content, or visual styling.

**Architecture:** Keep the existing Next.js App Router, component boundaries, and Tailwind CSS v4 token system. Apply responsive utilities directly to the shared shell and existing route components, using mobile-safe base classes with `sm`/`md`/`lg` enhancements and fluid `clamp()` values only where text or spacing needs interpolation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, existing design tokens in `app/globals.css`.

## Global Constraints

- Support 320px phone widths through desktop, including portrait and landscape-like aspect ratios.
- Preserve all existing copy, links, routes, auth behavior, theme behavior, image assets, colors, typography family, and interaction models.
- Use Tailwind utility classes and existing design tokens; add no dependencies.
- Preserve DOM reading order and do not hide core functionality on mobile.
- Preserve the current in-progress visual work in the working tree.

### Task 1: Responsive global shell and navigation

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/layout/navbar.tsx`
- Modify: `components/layout/footer.tsx`
- Test: manual route shell checks plus `npm run lint`

**Interfaces:**
- Consumes: existing CSS variables, `Navbar`, `Footer`, `ThemeToggle`, and auth context.
- Produces: a shell that never horizontally overflows at 320px, keeps controls at least 44px tall, and wraps long utility text safely.

- [ ] **Step 1: Establish the mobile shell baseline**

  In `app/globals.css`, retain `body { min-width: 20rem; }`, add safe text wrapping for the document (`overflow-wrap: anywhere` only where needed rather than globally), and ensure the viewport uses the existing Next.js viewport behavior. Keep the existing focus, reduced-motion, and color-theme rules unchanged.

- [ ] **Step 2: Make the navbar width-safe**

  In `components/layout/navbar.tsx`, add `min-w-0` to the inner flex row and logo link, use a fluid logo height such as `h-[clamp(2rem,8vw,2.5rem)]`, and keep the mobile control group from shrinking below its 44px targets. Make menu links and mobile action controls wrap/stack without changing the disclosure logic or labels.

- [ ] **Step 3: Make footer content wrap cleanly**

  In `components/layout/footer.tsx`, preserve the current grid and stacked mobile order while adding `min-w-0`, safe wrapping for the email/link values, and fluid gutters only if the 320px check shows cramped content. Keep external-link behavior and copyright content identical.

- [ ] **Step 4: Run shell checks**

  Run `npm run lint`.

  Expected: PASS with no new warnings or errors.

### Task 2: Homepage mobile and fluid layout

**Files:**
- Modify: `components/home/hero-section.tsx`
- Modify: `components/home/apps-grid.tsx`
- Modify: `components/home/app-card.tsx`
- Modify: `components/home/about-section.tsx`
- Modify: `components/home/features-section.tsx`
- Modify: `components/home/closing-cta.tsx`
- Test: homepage checks at 320px, 375px, 768px, and 1024px plus `npm run lint`

**Interfaces:**
- Consumes: existing `apps`, `features`, `AppCard`, and homepage section IDs.
- Produces: homepage sections that stack in DOM order, keep actions tappable, and avoid metadata or long copy overflow.

- [ ] **Step 1: Fluidly size the hero**

  In `hero-section.tsx`, retain the current centered composition and copy. Use a bounded `clamp()` heading size, fluid top/bottom padding, `min-w-0` on the content wrapper, and keep the two actions full-width at base width with the existing `sm:flex-row sm:w-auto` transition.

- [ ] **Step 2: Make app cards width-safe**

  In `app-card.tsx`, preserve the screenshot, status, stack, description, and action. Add `min-w-0` to card/content flex children, let the status/technology row wrap with a mobile-friendly alignment, apply `break-words` to potentially long app copy, and keep the action full-width on phones and inline from `sm` upward.

- [ ] **Step 3: Tune app grid, about, features, and CTA**

  In `apps-grid.tsx`, `about-section.tsx`, `features-section.tsx`, and `closing-cta.tsx`, keep the current desktop breakpoints and visual styling while adding fluid section spacing/gutters and safe wrapping. Ensure about link rows remain readable at 320px, feature content stays single-column until `md`, and closing CTA buttons do not overflow.

- [ ] **Step 4: Run homepage checks**

  Run `npm run lint` and inspect `/` at 320px, 375px, 768px, and 1024px widths.

  Expected: no horizontal scrollbar; hero actions, app-card actions, nav controls, and footer links remain reachable and readable.

### Task 3: PawPress responsive content page

**Files:**
- Modify: `app/pawpress-cms/page.tsx`
- Modify: `components/pawpress/project-hero.tsx`
- Test: PawPress checks at 320px, 375px, 768px, and 1024px plus `npm run lint`

**Interfaces:**
- Consumes: current PawPress content arrays, `ProjectHero`, and existing Tailwind token classes.
- Produces: a readable single-column mobile page that restores the current multi-column composition at larger widths.

- [ ] **Step 1: Make the project hero fluid**

  In `project-hero.tsx`, keep the image, copy, status labels, and links unchanged. Add `min-w-0` to both grid children, use a fluid heading size bounded by the current desktop maximum, keep action links full-width at base width, and preserve the existing `sm:flex-row` transition.

- [ ] **Step 2: Protect PawPress content sections**

  In `app/pawpress-cms/page.tsx`, retain the existing `lg` column transitions and DOM order. Add fluid section spacing, `min-w-0` to grid children, wrapping-safe classes for prose and lists, and mobile full-width CTA controls. Preserve existing border placement; outcome/workflow/comparison sections must stack without clipped borders or cramped columns.

- [ ] **Step 3: Check image and dark CTA behavior**

  Verify the screenshot uses its existing responsive `sizes`, remains contained by the panel, and the final dark CTA stacks its action links on small screens while returning to the existing inline arrangement at `sm`/`lg`.

- [ ] **Step 4: Run PawPress checks**

  Run `npm run lint` and inspect `/pawpress-cms` at 320px, 375px, 768px, and 1024px widths.

  Expected: no horizontal scrollbar, all content remains visible, and external links remain unchanged.

### Task 4: Sign-in and legal page responsiveness

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `components/shared/legal-document.tsx`
- Modify: `app/privacy-policy/page.tsx` only if inspection finds a route-specific overflow issue
- Modify: `app/terms-of-service/page.tsx` only if inspection finds a route-specific overflow issue
- Test: route checks for `/login`, `/privacy-policy`, and `/terms-of-service` plus `npm run lint`

**Interfaces:**
- Consumes: existing auth states, legal content, and shared legal shell.
- Produces: mobile-safe centered auth and readable legal documents without changing any auth or legal copy.

- [ ] **Step 1: Make sign-in panel fluid**

  In `app/login/page.tsx`, preserve loading/error behavior and the Google sign-in handler. Use fluid page padding, a full-width panel constrained by the current `max-w-md`, a bounded heading size, and a full-width 44px-or-taller sign-in button.

- [ ] **Step 2: Make the legal shell fluid**

  In `components/shared/legal-document.tsx`, keep the current max reading width and header structure. Add fluid outer padding and `min-w-0`/wrapping-safe behavior so long email and URL strings do not force horizontal scrolling.

- [ ] **Step 3: Correct only demonstrated legal overflow**

  Inspect both legal route files for fixed-width or inline content that fails at 320px. If needed, add only local wrapping utilities; do not rewrite policy content or alter section semantics.

- [ ] **Step 4: Run auth/legal checks**

  Run `npm run lint` and inspect `/login`, `/privacy-policy`, and `/terms-of-service` at 320px and 375px widths.

  Expected: the panel and legal prose fit the viewport, links wrap, and focus/error states remain visible.

### Task 5: Full verification and handoff

**Files:**
- Modify: only files identified in Tasks 1–4
- Test: full lint, production build, and responsive route matrix

**Interfaces:**
- Consumes: all completed responsive changes.
- Produces: verified responsive app with no functional regressions.

- [ ] **Step 1: Run the complete static checks**

  Run `npm run lint` followed by `npm run build`.

  Expected: both commands exit successfully.

- [ ] **Step 2: Run the route matrix**

  Check `/`, `/pawpress-cms`, `/login`, `/privacy-policy`, and `/terms-of-service` at 320px, 375px, 768px, 1024px, and a wide desktop width. Include portrait and a landscape-like viewport ratio at phone width.

- [ ] **Step 3: Verify interactions**

  Confirm mobile Menu/Close disclosure, theme toggle, sign-in button/error presentation, all primary CTAs, external-link targets, keyboard focus rings, and reduced-motion behavior remain functional.

- [ ] **Step 4: Review the diff**

  Run `git diff --check` and `git status --short`. Confirm no dependencies, content, or unrelated files changed and no horizontal overflow is introduced by the responsive pass.
