import { App, Feature } from "@/lib/types";

export const apps: App[] = [
  {
    name: "PawPress CMS",
    href: "/pawpress-cms",
    description: "Free and open-source headless CMS built with Next.js and Tailwind CSS.",
    status: "Live",
    icon: "🐱",
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
