# Cloudflare Pages Deployment Guide

## Build Settings for Cloudflare Pages

When setting up your project on Cloudflare Pages, use these settings:

### Framework preset
- **Framework**: Next.js (Static HTML Export)

### Build Configuration
- **Build command**: `npm run build`
- **Build output directory**: `out`
- **Root directory**: `/` (or leave blank)

### Environment Variables (Optional)
Add these in the Cloudflare Pages dashboard if using Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Node.js Version
- **Node.js version**: 18.x or higher (set via `.nvmrc` file or environment variable `NODE_VERSION=18`)

## Troubleshooting

### If you get a 404 error:
1. Make sure the **build output directory** is set to `out`
2. Verify the build completed successfully in the deployment logs
3. Check that `next.config.ts` has `output: 'export'`
4. Ensure there's an `index.html` file in the `out` directory after build

### To test locally:
```bash
npm run build
npx serve out
```

## Deployment Steps

1. Push your code to GitHub
2. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
3. Click "Create a project"
4. Connect to your GitHub repository
5. Set the build settings as shown above
6. Click "Save and Deploy"

## Important Notes

- The project is configured for **static export** (`output: 'export'` in next.config.ts)
- This means you cannot use Next.js features that require a server (SSR, API routes, ISR)
- All pages are pre-rendered at build time
- Images are unoptimized (no Next.js Image Optimization)

## Current Configuration

Your `next.config.ts` is already configured with:
```typescript
{
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
}
```

This configuration is **required** for Cloudflare Pages static hosting.
