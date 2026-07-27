# 34cats Apps

The gateway site at [apps.34cats.com](https://apps.34cats.com) — an index of the
apps built under 34cats, plus the shared account and the legal pages.

Apps that grow past a landing page move to their own repo and subdomain
(Resumeow lives at `resumeow.34cats.com`). What stays here: the index, PawPress
CMS's write-up, sign-in, privacy policy, terms.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase auth

## Running it

```bash
npm install
npm run dev
```

Supabase credentials go in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`npm run build` for production, `npm run lint` for ESLint.

## Layout

```
app/            Routes: /, /login, /auth/callback, /pawpress-cms, legal pages
components/
  home/         Homepage sections (hero, apps index, rules, about)
  layout/       Navbar, footer
  pawpress/     PawPress write-up sections
  shared/       Used in more than one place
config/         apps.ts (the index), navigation.ts, site.ts
lib/            supabase clients, types, cn() helper
hooks/          use-auth, use-mounted
```

## Design tokens

Everything visual comes from `@theme` in [app/globals.css](app/globals.css) —
no `gray-800`, no hex codes in components.

| Token                                | Use                                       |
| ------------------------------------ | ----------------------------------------- |
| `ink` / `ink-raised`                 | Page background / raised panels           |
| `line` / `line-strong`               | Hairline rules, borders                   |
| `bone` / `ash` / `ash-dim`           | Primary / secondary / tertiary text       |
| `ember`                              | Accent for type and rules                 |
| `ember-deep`                         | Solid fills behind white text (contrast)  |
| `moss`                               | Positive status                           |

Fonts: Instrument Serif (`font-display`) for headings, Geist for body, Geist
Mono for the uppercase `label` eyebrows. The font variables are set on `<html>`
so Tailwind's `:root` theme can resolve them — moving them to `<body>` silently
breaks every `font-*` utility.

Every text colour on `ink` clears WCAG AA (4.5:1). Solid buttons use
`ember-deep`, not `ember`, for that reason.

## Adding an app

1. Add an entry to `config/apps.ts`. Absolute `href` for its own subdomain, a
   path if it's hosted here.
2. If it's hosted here, add the route under `app/`.

## Deployment

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md). Note that
`/auth/callback` is server-rendered, so a pure static export won't serve the
sign-in flow.
