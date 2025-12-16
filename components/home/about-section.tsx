export function AboutSection() {
  return (
      <section id="about" className="px-4 py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Can&apos;t Spell &quot;Functional&quot; without &quot;Fun&quot;
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            While some of the apps here are built for fun, we never compromise on functionality. 
            Each app is designed to provide real value, whether it&apos;s boosting your productivity, sparking creativity, or simply bringing a smile to your face.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-lg border border-gray-700">
            <span className="text-gray-300">Want to collaborate or learn more?</span>
            <a href="mailto:34cats.dev@gmail.com" className="text-[#E84A3A] font-semibold hover:underline">
              Get in touch
            </a>
          </div>
        </div>
      </section>
  );
}
