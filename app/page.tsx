export default function Home() {
  const apps = [
    {
      name: "CatGPT",
      href: "/catGPT",
      description: "Your innovative AI companion",
      status: "Coming Soon",
      icon: "🐱",
    },
    {
      name: "Catasktrophe",
      href: "/catasktrophe",
      description: "Task management reimagined",
      status: "Live",
      icon: "✓",
    },
    // Add more apps here
  ];

  const features = [
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Built with performance in mind",
    },
    {
      icon: "🎯",
      title: "Purpose-Built",
      description: "Designed to solve real problems",
    },
    {
      icon: "🚀",
      title: "Modern Stack",
      description: "Cutting-edge technologies",
    },
  ];

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32">
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

      {/* Features Section */}
      <section className="px-4 py-16 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Why Choose Our Apps?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-gray-800 bg-gray-800/50 hover:border-[#E84A3A] hover:shadow-lg hover:shadow-[#E84A3A]/10 transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apps Section */}
      <section id="apps" className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
            Our Apps
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Discover our collection of tools and experiments
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app, index) => (
              <a
                key={index}
                href={app.href}
                className="group p-6 bg-gray-800/50 rounded-xl border border-gray-800 hover:border-[#E84A3A] hover:shadow-xl hover:shadow-[#E84A3A]/10 transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{app.icon}</div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === "Live"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[#E84A3A] transition-colors">
                  {app.name}
                </h3>
                <p className="text-gray-400">{app.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

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