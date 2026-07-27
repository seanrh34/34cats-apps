import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { AboutSection } from "@/components/home/about-section";
import { AppsGrid } from "@/components/home/apps-grid";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <AppsGrid />
      <FeaturesSection />
      <AboutSection />
    </main>
  );
}
