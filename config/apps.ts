import { App, Feature } from "@/lib/types";

export const apps: App[] = [
  {
    name: "CatGPT",
    href: "/catGPT",
    description: "Your innovative AI companion",
    status: "Coming Soon",
    icon: "🐱",
  },
  {
    name: "Catasktrophe",
    href: "/catasktrophe",
    description: "Task management reimagined",
    status: "Live",
    icon: "✓",
  },
  // Add more apps here
];

export const features: Feature[] = [
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Built with performance in mind",
  },
  {
    icon: "🎯",
    title: "Purpose-Built",
    description: "Designed to solve real problems",
  },
  {
    icon: "🚀",
    title: "Modern Stack",
    description: "Cutting-edge technologies",
  },
];
