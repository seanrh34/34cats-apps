export interface App {
  name: string;
  /** Absolute URL for apps living on their own subdomain, path for ones hosted here. */
  href: string;
  description: string;
  status: "Live" | "Coming Soon" | "Beta" | "In Development";
  stack: string[];
  /** Path to a screenshot image for the app card. */
  image: string;
  /** Pastel backing colour for the app card and hero tile. Defaults to sky. */
  tint?: AppTint;
}

export type AppTint = "butter" | "sage" | "lilac" | "sky";

export interface Feature {
  title: string;
  description: string;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
}
