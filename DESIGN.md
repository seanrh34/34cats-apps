---
name: 34cats App Portal
description: A calm, familiar gateway for practical tools.
colors:
  canvas: "#f7f7f5"
  surface: "#ffffff"
  surface-subtle: "#efefec"
  text: "#202123"
  text-muted: "#676767"
  border: "#deded9"
  accent: "#d94f32"
  accent-hover: "#bd3f26"
  success: "#2f7d4b"
  warning: "#9a6500"
  danger: "#b42318"
typography:
  display:
    fontFamily: "Arial, Helvetica, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Arial, Helvetica, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
  subtitle:
    fontFamily: "Arial, Helvetica, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Arial, Helvetica, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Arial, Helvetica, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
  control:
    fontFamily: "Arial, Helvetica, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  control: "12px"
  panel: "16px"
  status: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "24px"
---

# Design System: 34cats App Portal

## Overview

**Creative North Star: "The Familiar Workspace"**

34cats uses the calm, immediately understandable product language associated
with ChatGPT and Claude: neutral surfaces, direct language, generous breathing
room, and familiar controls. The interface should disappear behind the choice
of useful apps, not ask visitors to decode a metaphor.

The system remains recognizably 34cats through the existing logo, restrained
orange accents, and practical copy. It borrows a craft level—not layouts,
trademarks, or proprietary assets—from the named references.

**Key Characteristics:**

- Warm-neutral canvas with crisp white working surfaces.
- One workhorse sans-serif family and compact, readable hierarchy.
- Rounded controls and panels with restrained borders.
- Orange reserved for brand emphasis and meaningful links.
- Quiet motion limited to direct interaction feedback.

## Colors

The palette is Restrained: neutrals carry nearly every surface while 34cats
orange supplies a small amount of identity and emphasis.

### Primary

- **34cats Orange** (#d94f32): brand emphasis, active links, and selected state.

### Secondary

- **Success Green** (#2f7d4b): available and successful states.
- **Warning Ochre** (#9a6500): pending and incomplete states.
- **Danger Red** (#b42318): errors, unavailable states, and destructive actions.

### Neutral

- **Canvas** (#f7f7f5): page background.
- **Working Surface** (#ffffff): cards, forms, and reading panels.
- **Subtle Surface** (#efefec): hover, navigation, and grouped content.
- **Primary Text** (#202123): headings, controls, and body emphasis.
- **Muted Text** (#676767): supporting copy.
- **Soft Border** (#deded9): structure without visual noise.

**The Quiet Accent Rule.** Orange appears sparingly. Primary actions may use
neutral ink when that produces a calmer and clearer hierarchy.

## Typography

**Display Font:** Arial with system sans fallbacks  
**Body Font:** Arial with system sans fallbacks

**Character:** A single reliable family keeps the portal familiar and fast.
Hierarchy comes from size, weight, and space—not novelty type or uppercase
costume.

### Hierarchy

- **Display** (600, clamp(2.75rem, 7vw, 5.5rem), 1): homepage thesis.
- **Title** (600, 1.75rem, 1.15): page and section headings.
- **Subtitle** (600, 1.125rem, 1.4): component and subsection headings.
- **Body** (400, 1rem, 1.6): prose capped near 70 characters.
- **Label** (600, 0.8125rem, 1.2): controls, statuses, and compact metadata.

## Layout

Pages use a centered 72rem container with 1.25rem narrow-screen gutters and
2rem gutters above tablet width. Homepage content follows a simple rhythm:
value proposition, app choices, operating principles, and operator context.
App cards form one responsive grid and keep actions aligned.

The spacing scale is 4/8/16/24/32/48/64px. Reading pages narrow to 70ch.
Mobile layouts stack in DOM order without hiding primary content.

## Elevation & Depth

Surfaces are flat at rest. Borders and subtle tonal changes create hierarchy;
the single optional panel shadow is soft, neutral, and used only when a surface
must lift above another.

**The Flat-by-Default Rule.** Do not combine a border and a large shadow on the
same ordinary card.

## Shapes

Controls use 12px corners and content panels use 16px. Fully rounded pills are
reserved for short status labels. Shapes stay consistent across themes.

## Components

### Buttons

- **Primary:** primary-text fill, white label, 12px corners, 44px minimum height.
- **Secondary:** working-surface fill with one soft border.
- **Focus:** visible 3px orange outline with 3px offset.
- **Disabled:** lower contrast plus native disabled semantics.

### Status labels

Compact rounded labels pair semantic color with literal text. Color never
carries status alone.

### Cards / Containers

Cards use the working surface, a 1px soft border, 16px corners, and 24–32px
padding. Hover changes the border and surface slightly; it does not jump.

### Inputs / Fields

Fields use a persistent label, white surface, soft border, 12px corners, and a
clear orange focus ring. Errors name the problem and recovery.

### Navigation

Navigation is a quiet sticky bar: logo left, a small set of text links, then
credits and account actions. Mobile navigation expands below the bar.

## Do's and Don'ts

### Do:

- **Do** make every app understandable by name, outcome, status, and action.
- **Do** keep controls familiar and copy literal.
- **Do** preserve visible focus, 44px targets, and responsive reading order.
- **Do** let whitespace separate distinct ideas.

### Don't:

- **Don't** copy ChatGPT or Claude branding, assets, or proprietary layouts.
- **Don't** reintroduce the concourse metaphor, split-flap lettering, or status lamps.
- **Don't** use orange on every border, heading, and button.
- **Don't** invent prices, balances, usage numbers, or customer proof.
