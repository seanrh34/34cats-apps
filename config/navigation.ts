export interface NavItem {
  name: string;
  href: string;
  external?: boolean;
}

export const mainNavItems: NavItem[] = [
  { name: "Home", href: "/#home" },
  { name: "Apps", href: "/#apps" },
  { name: "About", href: "/#about" },
];

export const appNavItems: NavItem[] = [
  { name: "Catasktrophe", href: "/catasktrophe" },
  // Add more app routes here as they're created
];
