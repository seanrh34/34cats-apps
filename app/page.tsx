import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { AboutSection } from "@/components/home/about-section";
import { AppsGrid } from "@/components/home/apps-grid";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 to-black">
      <HeroSection />
      <FeaturesSection />
      <AppsGrid />
      <AboutSection />
    </main>
  );
}
