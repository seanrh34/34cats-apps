# 34cats Apps — Playful Redesign ("The Workbench")

Design direction owner: Claude (Opus), acting as designer. Implementers follow this
spec; deviations need a reason written in the PR/report.

## Why

The current portal is clean but reads as a generic SaaS template: centered Arial
headline, flat white cards, no motion. Sean wants it to feel personal, less
corporate, and alive — lots of motion and nicer surfaces, without needing the
visitor to click anything to see it.

## North star: "The Workbench"

A warm, hand-made studio for one developer and his apps. Paper and ink, a
tomato-red accent taken from the logo's open bracket, a little line-drawn cat
who lives on the page, and motion that feels like things being *drawn* and
*placed on a desk* rather than slick corporate fades.

Keywords: warm, hand-made, confident, a bit cheeky, still clearly legible and fast.

Hard rules that still apply (from PRODUCT.md):
- Keep the 34cats name and existing logo assets (navbar logo images stay).
- No invented numbers, testimonials, prices, user counts or guarantees. Counts
  shown on the page must be derived from `config/apps.ts` (e.g. `apps.length`).
- Accessible: WCAG AA contrast for text, visible focus, 44px tap targets,
  `prefers-reduced-motion` turns all non-essential motion off (content must be
  fully visible with motion off — never leave things at opacity 0).
- No new heavy dependencies. Motion is CSS + small client hooks
  (IntersectionObserver, pointer events). No framer-motion/GSAP/three.js.

## Foundations

### Type (next/font/google, set up in `app/layout.tsx` as CSS variables)
- Display: **Bricolage Grotesque** (variable; use opsz + weights 500–800). Big,
  tight (`letter-spacing: -0.04em` at hero size), slightly quirky.
- Body: **Instrument Sans** (400/500/600).
- Labels / meta / ticker: **JetBrains Mono** (400/500), uppercase small labels
  with `letter-spacing: 0.08em`.
Replace the Arial stack in `@theme`. `font-display: swap` (next/font default).

### Color tokens (replace current values; keep token *names* used by Tailwind so
other pages keep working: platform, platform-raised, surface-subtle, copy,
copy-muted, rail, signal, live, warning, cancelled)

Light ("paper"):
- canvas `#f5efe4` (warm paper), surface `#fffaf1`, surface-subtle `#ece4d4`
- text `#1c1915` (ink), text-muted `#5f574b`, border `#ddd2bf`, border-strong `#b9ab92`
- accent / signal `#d9472b` (tomato, from logo) — check AA on canvas for text; use
  `#c23d22` for small text if needed
- extra playful tints (new tokens): butter `#f4c95d`, sage `#a8c9a0`,
  lilac `#c8b6ee`, sky `#9cc3e6`
- success `#2f7a47`, warning `#8a5a00`, danger `#b42318`

Dark ("night studio"):
- canvas `#17140f`, surface `#221e17`, surface-subtle `#2d2820`
- text `#f3ecdf`, text-muted `#b5aa97`, border `#3b3429`, border-strong `#5a5041`
- accent `#ff6a4a`; tints slightly desaturated/darker so ink text on them still
  passes, or use them only as fills behind dark-ink text.
Keep the existing three-way theme mechanism (data-theme + prefers-color-scheme +
localStorage script). Both themes must look designed, not inverted.

### Texture
- Subtle paper grain over the whole page: a fixed, `pointer-events:none` pseudo
  element on body using an inline SVG `feTurbulence` noise data-URI at ~4–6%
  opacity (lower in dark). Must not hurt scroll perf (no blend modes on large
  animated layers).
- Optional faint dot grid behind the hero only, masked with a radial gradient.

### Shape & depth
- Radius: controls 14px, panels 22px, pills full.
- "Desk" shadows: hard offset ink shadow for primary objects
  (`box-shadow: 4px 4px 0 var(--text)`), used sparingly: primary button, app
  cards on hover, the about note. Ordinary panels stay border-only.
- The open bracket from the logo (an orange square with a gap on the right side)
  is THE motif. Build it as a reusable SVG component `<Bracket />` that can draw
  itself (stroke-dasharray animation) and be used as a frame around things.

### Buttons
- Primary: ink fill, paper text, 14px radius, hard 3px offset shadow in tomato;
  hover: translate(-2px,-2px) and shadow grows to 5px; active: shadow 0, translate
  back (a "press" feel). Arrow icons slide 3px on hover.
- Secondary: transparent with 1.5px ink border, same press behaviour without shadow.
- Keep `.portal-button`, `.portal-button-primary`, `.portal-button-secondary`
  class names (other pages use them) but restyle them.

### Motion system (globals.css + `components/motion/*`)
- Easing: `--ease-out-back: cubic-bezier(.34,1.56,.64,1)` for playful pops,
  `--ease-arrive: cubic-bezier(.16,1,.3,1)` for reveals.
- `<Reveal>` client component (or a `useReveal` hook + `data-reveal` attribute):
  IntersectionObserver adds `.is-visible` once; variants: `up` (translateY 24px),
  `tilt` (rotate -2deg + up), `draw` (for SVG strokes). Stagger via
  `style={{'--d': '120ms'}}`. SSR markup must render visible content when JS is
  off: gate hidden initial state behind a `.js` class set on `<html>` by the
  existing inline head script.
- Reduced motion: everything visible, no transforms, marquee stopped, cat static.
- Durations: 400–900ms for entrances; hovers 160–220ms.

## Page: Home (`app/page.tsx`)

Update the THESIS comment block at the top to match this direction.

### 1. Navbar (floating pill)
- Detached from the top: `sticky top-3`, centered, max-w-6xl, rounded-full,
  paper surface at 80% with backdrop blur, 1px border, small soft shadow.
- Logo left (existing images), links "Apps", "About" with an animated underline
  that draws from left on hover; right side: Credits ↗, theme toggle, Sign in
  (primary). Theme toggle icon rotates/morphs on switch.
- Mobile: pill with logo + theme + Menu button; menu opens as a panel under the
  pill with items sliding in staggered (CSS), closes on link click and Escape.
- Navbar gains a slightly stronger shadow after scrolling past 8px.

### 2. Hero
Layout: desktop two columns (text left ~55%, illustration right); phone stacks,
illustration below text and smaller.
- Mono label: `● SOFTWARE PROJECTS BY SEAN` — dot pulses softly in tomato.
- H1 (display, ~clamp(3rem, 8vw, 6.5rem)): "My proving grounds, your
  **playground**." Words rise in one by one (split by word, staggered 60ms,
  overflow-hidden line masks). "playground" is tomato with a hand-drawn SVG
  squiggle underline that draws itself after the words land.
- Body: "Practical web tools I build to learn new technologies — and keep
  running after launch. Most are free; one 34cats credit balance covers the paid
  bits." (factual per PRODUCT.md / config features).
- Actions: primary "Explore the apps ↓" (#apps), secondary "How credits work ↗"
  (credits.34cats.com, new tab, sr-only "(opens in a new tab)").
- Small mono meta row under actions: `{apps.length} apps live · free to try · no
  card needed` (count from config; "live" counts apps with status Live).

Illustration (right): "the desk"
- The tomato open-bracket square draws itself (stroke animation ~1.2s).
- Inside/overlapping it, two or more "app tiles" (one per app from config; tile
  = small card with app name in display font, status dot, and tinted fill using
  the per-app tint) placed at slight rotations, dropping in with a pop
  (`ease-out-back`) after the bracket draws, then gently bobbing (each a
  different 5–8s float loop, ±6px).
- Pointer parallax on fine pointers only (`(pointer:fine)`): tiles shift up to
  ~10px opposite the cursor; bracket ~4px. rAF-throttled, transform only.
- **The cat**: a simple line-drawn cat (inline SVG, ink stroke ~2.5px, no fill or
  paper fill) sitting on the top edge of the bracket. Tail sways (CSS rotate on
  the tail path, transform-origin at its base, 3s ease-in-out infinite
  alternate). Eyes blink every ~4–6s (scaleY on eye group). On fine pointers,
  the pupils follow the cursor (clamped 2–3px). Purely decorative:
  `aria-hidden`. The cat should look charming and intentional — keep it
  minimal (head with two triangular ears, body as a rounded loaf, curly tail),
  roughly 120–160px wide on desktop. This is the signature element; spend care.

### 3. Ticker strip
Full-bleed band between two 1px ink rules (or tilted -1.5deg band in ink with
paper text — choose whichever looks better; tilted band preferred if it doesn't
cause horizontal scroll — clip with overflow hidden on a wrapper).
Content: unique tech from all apps' `stack` + app names, separated by a small
cat-paw or ✦ glyph, in JetBrains Mono uppercase. Infinite marquee (CSS
translateX on a duplicated track, ~40s), pauses on hover, stopped under reduced
motion. Duplicate track is `aria-hidden`.

### 4. Apps ("The shelf") `#apps`
- Heading row: mono label `THE SHELF — 0{n} APPS`, H2 "Things I've shipped." and
  a short right-aligned note "New apps join as I learn new tech." (existing copy).
- Cards (2-col on md+, 1-col on phone; must still look right with 3–4 apps):
  - Each card has a per-app tint background panel (add optional `tint` field to
    the App type/config: PawPress = butter, Resumeow = lilac; default sky).
  - Screenshot sits inside a mini browser-chrome frame (3 dots + fake URL bar
    showing the app's host, e.g. `apps.34cats.com/pawpress-cms`,
    `resumeow.34cats.com`) placed on the tint panel at a slight rotation
    (±1.5deg alternating). Keep the existing crop behaviour so the screenshot
    edges don't show (the frame clips the image).
  - On hover/focus-within: frame straightens to 0deg and lifts 6px, card gets the
    hard ink offset shadow, the "Open app →" arrow slides, a little bracket
    corner draws in at top-left. Respect reduced motion.
  - Below the visual: status pill (Live = green dot that pulses), name (display
    font, large), description, stack as small mono chips, action button.
  - The whole card is NOT one giant link (keeps the button as the action), but
    the screenshot also links to the app (same href, `tabIndex={-1}` and
    `aria-hidden` on that duplicate link).
- Cards reveal with `tilt` variant, staggered.

### 5. How it works (replaces nothing; new, honest, short) — 3 steps
Mono label `HOW THESE GET MADE`. Three columns on desktop, stacked on phone:
1. "Pick a chore" — Start with an ordinary task that could be quicker.
2. "Ship it for real" — Build it with tech I want to learn, and put it live.
3. "Keep it running" — Launch is the start of maintenance, not the finish.
(Copy from PRODUCT.md principles.) Big outlined mono numerals 01/02/03. A dashed
tomato line connects the steps and draws itself as the section scrolls into view
(horizontal on desktop, vertical on phone).

### 6. About `#about`
- Left: H2 "Hi, I'm Sean." + the existing about paragraph (fix the stray
  `&nbsp;` spacing). Present it as a slightly rotated (-1deg) paper "note" card
  with a strip of tape (CSS) at the top and hard ink shadow; it straightens on
  hover.
- Right: link rows (Portfolio / Writing / Contact) as large rows: mono label,
  value in display font, note; on hover the row background fills with tint from
  left (scaleX transform on a pseudo-element) and an arrow slides in.

### 7. Closing CTA
Full-width ink block (in light theme: ink bg with paper text; in dark theme:
tomato-tinted surface) with rounded 28px corners inside the container margin.
Headline "Free to use or free to try. No credit card required." (display, big),
sub "Open an app and bookmark it if you like it.", primary button inverted.
The cat's tail (or a second small cat peeking with ears + eyes) peeks over the
top edge of the block and the ears twitch when the block scrolls into view.

### 8. Footer
Keep link groups. Add a giant "34cats" wordmark in display font at the bottom,
outlined text (`-webkit-text-stroke`) in border-strong, partly cropped by the
footer's bottom edge, that fills with tomato from left to right on hover (or on
reveal for touch). `aria-hidden` (the real name already appears). Must not cause
horizontal scroll at 320px.

## Secondary pages (phase 2)
`/pawpress-cms`, `/login`, `/privacy-policy`, `/terms-of-service`, 404:
inherit new tokens/fonts/buttons automatically; then lightly align:
- Section labels → mono label style; headings → display font.
- PawPress hero screenshot uses the same browser-chrome frame + butter tint panel
  and `<Reveal>`.
- PawPress final CTA matches the new ink CTA block.
- Login card: paper note style with hard shadow; the cat (reuse component,
  smaller) sits on top of the card.
- 404: big display "404" with the cat looking confused (pupils looking up/side,
  tail still), copy unchanged, buttons restyled.
- Legal pages: readable, calm — only type/color updates, no gimmicks.

## Docs
Rewrite `DESIGN.md` to describe this system (tokens, type, motion, motif,
do/don'ts) replacing the "Familiar Workspace" direction, and update `PRODUCT.md`'s
Brand Commitments sentence about ChatGPT/Claude craft level to: polished,
personal, hand-made studio feel; still honest and legible.

## Acceptance
- `pnpm lint` and `pnpm exec tsc --noEmit` clean.
- ui-visual-check at all 7 sizes, light AND dark, for every changed route; no
  horizontal scroll, no small tap targets introduced, no console errors.
- Reduced motion checked (Playwright `reducedMotion: 'reduce'`): all content
  visible.
- Lighthouse-ish sanity: no layout shift from fonts beyond next/font defaults; no
  animation on properties other than transform/opacity/stroke-dashoffset/clip-path.
