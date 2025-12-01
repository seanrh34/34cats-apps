export function HeroSection() {
  return (
    <section id="home" className="px-4 py-20 md:py-32">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-block mb-4 px-4 py-2 bg-[#E84A3A]/10 rounded-full text-[#E84A3A] text-sm font-medium">
          ✨ Building the Future
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-linear-to-r from-white via-[#E84A3A] to-white bg-clip-text text-transparent mb-6">
          34cats Apps
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Explore innovative tools, experiments, and AI-powered creations designed to enhance your digital experience
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
