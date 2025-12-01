export interface App {
  name: string;
  href: string;
  description: string;
  status: "Live" | "Coming Soon" | "Beta";
  icon: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
}
