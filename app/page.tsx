/*
THESIS: A warm, hand-made studio for one developer and his apps; paper, ink and
one tomato-red bracket make a practical collection feel personal, not corporate.
OWN-WORLD: Paper grain, ink outlines with hard offset shadows, the logo's open
bracket as the recurring motif, and a line-drawn cat who lives on the page.
STORY: Meet the studio, browse the shelf of apps, see how they get made, learn who
Sean is, then open an app; one credit balance quietly covers paid features.
FIRST VIEWPORT: A proving-grounds headline, a desk of live app tiles with the cat,
clear "explore" and "credits" actions, and a ticker leading to the shelf.
FORM: Playful but legible portal: display type with mono labels, press-down
buttons, motion that draws and places things; everything works without motion.
*/
import { HeroSection } from "@/components/home/hero-section";
import { TickerStrip } from "@/components/home/ticker-strip";
import { AppsGrid } from "@/components/home/apps-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { AboutSection } from "@/components/home/about-section";
import { ClosingCta } from "@/components/home/closing-cta";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <TickerStrip />
      <AppsGrid />
      <HowItWorks />
      <AboutSection />
      <ClosingCta />
    </main>
  );
}
