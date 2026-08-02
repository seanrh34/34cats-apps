export interface App {
  name: string;
  /** Absolute URL for apps living on their own subdomain, path for ones hosted here. */
  href: string;
  description: string;
  status: "Live" | "Coming Soon" | "Beta" | "In Development";
  stack: string[];
  /** Path to a screenshot image for the app card. */
  image: string;
}

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
