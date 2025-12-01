export default function Catasktrophe() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-green-500/10 rounded-full text-green-400 text-sm font-medium border border-green-500/20">
            ✓ Live Now
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Catasktrophe
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Task management reimagined. Stay organized, boost productivity, and never miss a deadline.
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Under Development
            </h2>
            <p className="text-gray-400 mb-6">
              We're working hard to bring you an amazing task management experience. 
              Check back soon for updates!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="px-6 py-3 bg-[#E84A3A] text-white rounded-lg font-semibold hover:bg-[#d43d2d] transition-all"
              >
                Back to Home
              </a>
              <a
                href="/#apps"
                className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                View Other Apps
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
