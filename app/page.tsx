/*
THESIS: A familiar, calm portal makes independent practical apps easy to trust
and open; it refuses metaphor-first navigation.
OWN-WORLD: Warm-neutral canvas, crisp working surfaces, restrained orange,
soft borders, and one workhorse sans-serif family.
STORY: Understand the collection, choose a useful app, return by bookmark, then
use one credit balance across the network when paid usage matters.
FIRST VIEWPORT: Direct value proposition, visible app action, and a quiet credit
link; the app collection begins immediately below.
FORM: Conventional product portal calibrated to the craft level of ChatGPT and
Claude without copying either product.
*/
import { HeroSection } from "@/components/home/hero-section";
import { AboutSection } from "@/components/home/about-section";
import { AppsGrid } from "@/components/home/apps-grid";
import { ClosingCta } from "@/components/home/closing-cta";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <AppsGrid />
      <AboutSection />
      <ClosingCta />
    </main>
  );
}
