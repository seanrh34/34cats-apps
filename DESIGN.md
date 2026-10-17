---
name: 34cats App Portal
description: A warm, hand-made studio for one developer and his apps.
colors:
  canvas: "#f5efe4"
  surface: "#fffaf1"
  surface-subtle: "#ece4d4"
  text: "#1c1915"
  text-muted: "#5f574b"
  border: "#ddd2bf"
  border-strong: "#b9ab92"
  accent: "#d9472b"
  accent-text: "#c23d22"
  butter: "#f4c95d"
  sage: "#a8c9a0"
  lilac: "#c8b6ee"
  sky: "#9cc3e6"
  success: "#2f7a47"
  warning: "#8a5a00"
  danger: "#b42318"
  dark-canvas: "#17140f"
  dark-surface: "#221e17"
  dark-accent: "#ff6a4a"
typography:
  display: { fontFamily: "Bricolage Grotesque", fontWeight: 700, letterSpacing: "-0.04em" }
  body: { fontFamily: "Instrument Sans", fontWeight: 400 }
  label: { fontFamily: "JetBrains Mono", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: uppercase }
rounded:
  control: "14px"
  panel: "22px"
  status: "999px"
---

# Design System: 34cats App Portal

## Overview

**Creative North Star: "The Workbench"**

A warm, hand-made studio for one developer and his apps. Paper and ink, a
tomato-red accent taken from the logo's open bracket, a small line-drawn cat who
lives on the page, and motion that feels like things being drawn and placed on a
desk. Polished and personal, never corporate, always legible and honest.

## Colors

Light is "paper" (warm canvas, cream surfaces, ink text); dark is "night studio"
(warm near-black, never a plain inversion). Tomato is the accent: `accent` for
fills and large display text, `accent-text` (AA-safe) for small text. Four
pastel tints (butter, sage, lilac, sky) back app cards and hero tiles; in dark
they become deeper, desaturated fills. Semantic green/ochre/red carry status.
Token names used by Tailwind (`platform`, `platform-raised`, `surface-subtle`,
`copy`, `copy-muted`, `rail`, `signal`, `live`, `warning`, `cancelled`) are
stable; `tomato`, `butter`, `sage`, `lilac`, `sky` were added.

## Typography

Display: Bricolage Grotesque (large, tight, slightly quirky). Body: Instrument
Sans. Labels, meta and the ticker: JetBrains Mono, uppercase, 0.08em tracking.
All via `next/font/google` as CSS variables.

## Texture and depth

A faint paper-grain layer sits over the page (fixed, no blend modes). Primary
objects get a hard offset ink shadow (primary button, app cards on hover, the
about note, hero tiles); ordinary panels stay border-only.

## The bracket motif

The logo's open square (gap on the right) is THE motif: `<Bracket />` draws
itself with a stroke animation and frames the hero desk; a corner variant draws
in on app cards. The cat (`<Cat />`, `<PeekingCat />`) is the signature
character: tail sways, eyes blink, pupils follow fine pointers.

## Motion

Entrances 400-900ms with `--ease-arrive`; playful pops use `--ease-out-back`;
hovers 160-220ms. Only transform, opacity, stroke-dashoffset and clip-path
animate (small exceptions: button box-shadow). `<Reveal>` adds `.is-visible`
once in view; hidden initial states exist only under the `.js` class set by the
head script, so content is visible without JavaScript. With
`prefers-reduced-motion` everything is visible and static: no marquee, no
parallax, cat still. No animation libraries.

## Components

- Buttons: primary is ink fill with a tomato hard shadow and a press feel
  (hover lifts, active sinks); secondary is a 1.5px ink outline. 44px minimum.
  Classes: `.portal-button`, `-primary`, `-secondary`, `-inverse`.
- Status pill: mono label plus dot; Live pulses. Color never carries status alone.
- App card: tint panel with a rotated browser-chrome frame that straightens on
  hover; stack as mono chips; the button is the action.
- Navigation: floating pill, sticky, blurred paper; mobile menu panel under it.

## Do's and Don'ts

Do keep copy literal, counts derived from `config/apps.ts`, focus rings visible,
tap targets 44px, and content readable with motion off.
Don't invent numbers, testimonials, prices or guarantees. Don't use
tomato for small text below AA. Don't add heavy animation or 3D dependencies.
Don't put hard shadows on every panel.
