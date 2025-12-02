import Image from "next/image";

export function HeroSection() {
  return (
    <section id="home" className="px-4 py-12 md:pb-32">
      <div className="max-w-6xl mx-auto text-center">
        <Image src="/34cats_main.png" alt="34cats Apps Logo" width={2000} height={1200} className="mx-auto mb-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl h-auto" />
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Creating fun, innovative digital tools where some are just for fun but some are designed to boost your productivity and creativity.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#apps"
            className="px-8 py-4 bg-[#E84A3A] text-white rounded-lg font-semibold hover:bg-[#d43d2d] transition-all shadow-lg hover:shadow-xl hover:shadow-[#E84A3A]/20 transform hover:-translate-y-0.5"
          >
            Explore Apps
          </a>
          <a
            href="#about"
            className="px-8 py-4 bg-gray-800 text-gray-200 rounded-lg font-semibold hover:bg-gray-700 transition-all border border-gray-700 shadow-sm hover:shadow-md"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
