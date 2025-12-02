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
    description: "Task management (probably the 100th one you've seen)",
    status: "Coming Soon",
    icon: "✓",
  },
  // Add more apps here
];

export const features: Feature[] = [
  {
    icon: "😺",
    title: "Fun and Interesting",
    description: "They're fun for us to make and for you to enjoy!",
  },
  {
    icon: "🎯",
    title: "Purpose-Built",
    description: "Designed to solve real problems (and some that we create to sell to you)",
  },
  {
    icon: "🚀",
    title: "Modern Stack",
    description: "These are all the apps that we make as practice for learning the latest technologies",
  },
];
