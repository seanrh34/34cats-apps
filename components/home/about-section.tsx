export function AboutSection() {
  return (
      <section id="about" className="px-4 py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Can&apos;t Spell &quot;Functional&quot; without &quot;Fun&quot;
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            While some of the apps here are built for fun, I never compromise on functionality. 
            Each app is designed to provide real value, whether it&apos;s boosting your productivity, sparking creativity, or simply bringing a smile to your face.
          </p>
          
          {/* Developer Section */}
          <div className="mb-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-bold mb-3 text-white">
              The Developer behind 34cats
            </h3>
            <p className="text-gray-300 mb-4">
              Hi! Just a quick note, I&apos;m Sean, the creator of these apps, constantly learning and building new things. 
              Check out my portfolio site below to see more of my work and projects not parked in this site.
            </p>
            <a 
              href="https://34cats.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#E84A3A] font-semibold hover:underline"
            >
              Visit 34cats.com
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          
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
