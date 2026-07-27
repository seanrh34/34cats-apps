import { App, Feature } from "@/lib/types";

export const apps: App[] = [
  {
    name: "PawPress CMS",
    href: "/pawpress-cms",
    description:
      "A free, open-source headless CMS built into your Next.js app. No pricing tiers, no vendor lock-in, deploys as a static site on Cloudflare or Vercel.",
    status: "Live",
    stack: ["Next.js", "Supabase", "Tailwind"],
  },
  {
    name: "Resumeow",
    href: "https://resumeow.34cats.com",
    description:
      "LaTeX-quality resumes without touching LaTeX. Fill in the forms, get the PDF recruiters actually like reading.",
    status: "Live",
    stack: ["Next.js", "LaTeX", "Supabase"],
  },
  // Add more apps here
];

export const features: Feature[] = [
  {
    title: "Built to be used",
    description:
      "Every app here started as a problem I actually had. If it doesn't earn its place in my own week, it doesn't ship.",
  },
  {
    title: "Small on purpose",
    description:
      "No dashboards nobody asked for, no onboarding tour. The shortest path between opening the app and being done with it.",
  },
  {
    title: "Yours to keep",
    description:
      "Your data stays exportable and, where it makes sense, the source stays open. Nothing here holds your work hostage.",
  },
];
