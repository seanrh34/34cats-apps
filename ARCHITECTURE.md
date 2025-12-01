# 34cats Apps Architecture

This document describes the architecture and folder structure of the 34cats Apps project.

## 📁 Folder Structure

```
34cats-apps/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── catasktrophe/      # App routes
│
├── components/            # React components
│   ├── ui/               # Reusable UI components (Button, Card, Input)
│   ├── layout/           # Layout components (Header, Footer)
│   ├── home/             # Home page components
│   └── shared/           # Shared components
│
├── lib/                  # Utilities and configurations
│   ├── types/           # TypeScript type definitions
│   ├── supabase/        # Supabase client setup
│   └── utils.ts         # Helper functions
│
├── hooks/               # Custom React hooks
│   ├── use-auth.ts     # Authentication hook
│   └── use-mounted.ts  # Mounted state hook
│
├── config/              # App configuration
│   ├── site.ts         # Site metadata
│   └── apps.ts         # Apps configuration
│
└── public/              # Static assets
```

## 🎯 Key Principles

### Component Organization
- **UI Components** (`components/ui/`): Reusable, generic components like Button, Card, Input
- **Page Components** (`components/home/`, etc.): Page-specific components
- **Shared Components** (`components/shared/`): Components used across multiple pages
- **Layout Components** (`components/layout/`): Header, Footer, Navigation, etc.

### Data Management
- **Configuration Files** (`config/`): Centralized app data, constants, and configuration
- **Type Definitions** (`lib/types/`): Shared TypeScript interfaces and types
- **Utilities** (`lib/utils.ts`): Helper functions like `cn()` for class merging

### Path Aliases
Use the following import aliases for cleaner imports:
```typescript
import { Button } from "@/components/ui/button"
import { apps } from "@/config/apps"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
```

## 🔧 Supabase Setup

### Client Components
```typescript
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
```

### Server Components
```typescript
import { createClient } from "@/lib/supabase/server"

const supabase = await createClient()
```

### Environment Variables
Create a `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📦 Key Dependencies

- **clsx & tailwind-merge**: For conditional class name merging
- **@supabase/supabase-js**: Supabase JavaScript client
- **@supabase/ssr**: Supabase SSR utilities for Next.js

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📝 Adding New Apps

1. Create a new folder in `app/` (e.g., `app/my-new-app/`)
2. Add the app to `config/apps.ts`
3. Create components in `components/my-new-app/` if needed
4. Add types to `lib/types/index.ts` if needed

## 🎨 Styling

- Tailwind CSS for utility-first styling
- Custom design tokens in `app/globals.css`
- Component-specific styles using Tailwind classes
- Use `cn()` utility for conditional classes
