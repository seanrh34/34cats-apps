import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { AppsGrid } from "@/components/home/apps-grid";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 to-black">
      <HeroSection />
      <FeaturesSection />
      <AppsGrid />

      {/* About/CTA Section */}
      <section id="about" className="px-4 py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Built with Passion
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Each app is crafted with attention to detail, focusing on user experience and innovative solutions. More apps coming soon.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-lg border border-gray-700">
            <span className="text-gray-300">Want to collaborate or learn more?</span>
            <a href="mailto:contact@34cats.com" className="text-[#E84A3A] font-semibold hover:underline">
              Get in touch
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p className="mb-2">&copy; {new Date().getFullYear()} 34cats. All rights reserved.</p>
          <p className="text-sm">Building innovative digital experiences, one app at a time.</p>
        </div>
      </footer>
    </main>
  );
}
