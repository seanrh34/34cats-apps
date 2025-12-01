# Navbar Component Documentation

## Overview

The Navbar component is a fully responsive, sticky navigation bar that appears across all pages in the 34cats Apps project. It features mobile-friendly hamburger menu, active route highlighting, and smooth animations.

## Features

- **Sticky positioning** - Stays at the top while scrolling
- **Responsive design** - Mobile hamburger menu on small screens, full nav on desktop
- **Active route highlighting** - Shows current page with accent color and underline
- **Smooth animations** - Hover effects and transitions
- **Backdrop blur** - Semi-transparent background with blur effect
- **Centralized configuration** - Navigation items managed in `config/navigation.ts`
- **TypeScript support** - Full type safety

## Usage

The navbar is automatically included in the root layout (`app/layout.tsx`) and appears on all pages:

```tsx
import { Navbar } from "@/components/layout/navbar";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

## Configuration

Navigation items are managed in `config/navigation.ts`:

```typescript
export interface NavItem {
  name: string;
  href: string;
  external?: boolean;
}

export const mainNavItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Apps", href: "/#apps" },
  { name: "About", href: "/#about" },
];
```

### Adding New Navigation Items

To add a new link to the navbar:

1. Open `config/navigation.ts`
2. Add a new item to the `mainNavItems` array:

```typescript
export const mainNavItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Apps", href: "/#apps" },
  { name: "About", href: "/#about" },
  { name: "Blog", href: "/blog" }, // New item
];
```

### External Links

For external links, set the `external` flag:

```typescript
{
  name: "GitHub",
  href: "https://github.com/34cats",
  external: true
}
```

## Styling

The navbar uses Tailwind CSS with the project's design system:

- **Background**: `bg-gray-900/95` with backdrop blur
- **Accent color**: `#E84A3A` (brand red)
- **Text colors**: White and gray variants
- **Border**: Gray-800 bottom border

### Customizing Colors

To change the accent color, update the hover states in `navbar.tsx`:

```tsx
// Change from #E84A3A to your color
className="hover:text-[#YOUR_COLOR]"
```

## Components

### Desktop Navigation

Shows full navigation links with active state indicators:
- Horizontal layout
- Active route gets accent color and bottom border
- Hover effects on all items
- "Explore Apps" CTA button

### Mobile Navigation

Hamburger menu for small screens:
- Toggle button with animated icon
- Slide-down menu panel
- Full-width links
- Auto-closes on navigation

### Logo

Clickable logo with hover effect:
- Returns to home page
- "34cats" in white, "Apps" in accent color
- Smooth color transition on hover

## Active Route Detection

The navbar automatically highlights the current page using Next.js `usePathname()`:

```typescript
const isActive = (href: string) => {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href) && href !== "/";
};
```

## Accessibility

- Semantic HTML with `<nav>` element
- ARIA labels for mobile menu button
- Keyboard navigation support
- Focus states with ring indicators
- Screen reader friendly text

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Backdrop blur requires browser support
- Graceful fallback without backdrop filter

## Examples

### Basic Integration (Already Done)

The navbar is integrated in `app/layout.tsx` and appears on all pages automatically.

### Creating a Page with Navbar

All pages automatically have the navbar. Just create your page content:

```tsx
// app/my-page/page.tsx
export default function MyPage() {
  return (
    <main className="min-h-screen">
      {/* Navbar appears automatically above this */}
      <div className="container mx-auto px-4 py-16">
        <h1>My Page</h1>
      </div>
    </main>
  );
}
```

### Different Navbar for Specific Apps

If you need a different navbar for a specific app section:

1. Create a new layout in that app's folder:

```tsx
// app/my-app/layout.tsx
import { CustomNavbar } from "@/components/layout/custom-navbar";

export default function MyAppLayout({ children }) {
  return (
    <>
      <CustomNavbar />
      {children}
    </>
  );
}
```

2. The custom navbar will override the root navbar for that section.

## Performance

- **Client Component** - Uses React hooks for interactivity
- **Minimal re-renders** - State isolated to menu toggle
- **Optimized imports** - Tree-shakeable utilities
- **Static rendering** - Main structure renders on server

## Troubleshooting

### Navbar not showing
- Check that `<Navbar />` is in `app/layout.tsx`
- Verify import path: `@/components/layout/navbar`

### Active state not working
- Ensure you're using Next.js Link components
- Check that routes match the `href` in `mainNavItems`

### Mobile menu not closing
- Verify `onClick={() => setMobileMenuOpen(false)}` is on links
- Check state management in component

### Styling issues
- Ensure Tailwind CSS is properly configured
- Check that `cn()` utility is imported from `@/lib/utils`
- Verify backdrop-blur browser support

## Related Components

- **Footer** (`components/layout/footer.tsx`) - Page footer
- **Header** (`components/layout/header.tsx`) - Alternative header component
- **PageHeader** (`components/shared/page-header.tsx`) - Page title header

## Future Enhancements

Potential improvements:
- Dropdown menus for app categories
- Search functionality
- User authentication menu
- Notification badges
- Theme switcher
- Language selector
