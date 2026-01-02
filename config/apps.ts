import { App, Feature } from "@/lib/types";

export const apps: App[] = [
  {
    name: "PawPress CMS",
    href: "/pawpress-cms",
    description: "Free and open-source headless CMS built with Next.js and Tailwind CSS. Hostable as static sites like on Cloudflare and Vercel.",
    status: "Live",
    icon: "🐱",
  },
  {
    name: "Resumeow",
    href: "/resumeow",
    description: "Create professional resumes with LaTeX quality that you can get as PDFs immediately. Formatted in the way recruiters love.",
    status: "Live",
    icon: "📄",
  },
  // Add more apps here
];

export const features: Feature[] = [
  {
    icon: "😺",
    title: "Fun and Interesting",
    description: "They're fun for me to make and for you to enjoy!",
  },
  {
    icon: "🎯",
    title: "Purpose-Built",
    description: "Designed to solve real problems (and some that I create to sell to you)",
  },
  {
    icon: "🚀",
    title: "Modern Stack",
    description: "These are all the apps that I make as practice for learning the latest technologies",
  },
];
