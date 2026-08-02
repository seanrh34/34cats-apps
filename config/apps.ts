import { App, Feature } from "@/lib/types";

export const apps: App[] = [
  {
    name: "PawPress CMS",
    href: "/pawpress-cms",
    description:
      "A small headless CMS, inspired by WordPress, for projects and other blogs, with content stored in Supabase and pages deployed as static sites on Cloudflare or Vercel.",
    status: "Live",
    stack: ["Next.js", "Supabase", "Tailwind"],
    image: "/images/pawpress-screenshot.png",
  },
  {
    name: "Resumeow",
    href: "https://resumeow.34cats.com",
    description:
      "All-in-one job application platform, featuring a visual-based, AI-assisted resume builder that produces ATS-friendly resumes, no technical knowledge of LaTeX, etc required.",
    status: "Live",
    stack: ["Next.js", "LaTeX", "Supabase", "Agentic AI"],
    image: "/images/resumeow-screenshot.png",
  },
  // Add more apps here
];

export const features: Feature[] = [
  {
    title: "PawPress powers this site",
    description:
      "The pages you are reading right now are managed through PawPress. It is a live product, not a demo — content edits deploy as static pages in minutes.",
  },
  {
    title: "Resumes that pass automated screening",
    description:
      "Resumeow produces ATS-friendly PDFs from your profile. No LaTeX, no guesswork about whether a recruiter software can parse the output.",
  },
  {
    title: "One account, one credit balance",
    description:
      "Sign in once at 34cats and the same balance works across every app in the network. Most tools are free; credits unlock paid features when they matter.",
  },
];
