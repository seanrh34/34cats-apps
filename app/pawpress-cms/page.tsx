import { ProjectHero } from "@/components/pawpress/project-hero";
import { ContentSection } from "@/components/pawpress/content-section";
import { CapabilityList } from "@/components/pawpress/capability-list";

export default function PawPressCMSPage() {
  const capabilities = [
    {
      title: "Clean Writing Interface",
      description: "Write and manage content in an interface built specifically for blog writing. No unnecessary features, just the tools you need.",
    },
    {
      title: "Secure Authentication",
      description: "Built-in authentication ensures only authorized users can create and edit content.",
    },
    {
      title: "Straightforward Publishing",
      description: "Draft, publish, and update posts with a workflow that matches how writers actually work.",
    },
    {
      title: "Performance by Default",
      description: "Server-side rendering delivers fast page loads and excellent SEO without configuration overhead.",
    },
    {
      title: "Flexible Content Structure",
      description: "Structure your content your way. No predefined templates or rigid schemas to work around.",
    },
    {
      title: "Full Ownership",
      description: "Your content, your database, your deployment. No third-party service controls your data or charges based on usage.",
    },
  ];

  const advantages = [
    {
      title: "No Fees",
      description: "Unlike Contentful, Sanity, or other headless CMSs, there's no pricing tier that scales with your traffic or content volume.",
    },
    {
      title: "No Vendor Lock-In",
      description: "Content lives in your Postgres database in a standard format. Export or migrate anytime without proprietary APIs.",
    },
    {
      title: "Native Integration",
      description: "Because the CMS is part of your app, there's no API layer between your content and your pages. Updates appear instantly.",
    },
    {
      title: "Complete Control",
      description: "Modify the editor, add custom fields, or change the publishing workflow. You own the entire stack.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <ProjectHero
          title="PawPress CMS"
          tagline="A lightweight headless CMS for writers who want control without complexity."
          subtitle="Built directly into your Next.js app. No external services, no monthly fees, no vendor lock-in."
        />

        <ContentSection title="Why This Exists">
          <p>
            Most CMS platforms are over-engineered for simple blogs. WordPress requires managing plugins and updates. Headless solutions add pricing tiers and vendor lock-in.
          </p>
          <p>
            PawPress CMS is a headless content management system built directly into a Next.js application, designed specifically for blog writing and publishing.
          </p>
        </ContentSection>

        <ContentSection title="What It Does">
          <CapabilityList capabilities={capabilities} />
        </ContentSection>

        <ContentSection title="Key Advantages">
          <CapabilityList capabilities={advantages} />
        </ContentSection>

        <ContentSection title="How It Works">
          <p>
            PawPress CMS integrates directly into a Next.js application using a simple architecture:
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 my-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tech Stack</h3>
            <ul className="space-y-2 text-gray-300">
              <li><strong className="text-white">Next.js</strong> - Application framework and server-side rendering</li>
              <li><strong className="text-white">Supabase</strong> - Database, authentication, content storage, and real-time features</li>            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 my-6">
            <h3 className="text-lg font-semibold text-white mb-4">Architecture</h3>
            <ol className="space-y-2 text-gray-300 list-decimal list-inside">
              <li>Authors log in through Supabase authentication</li>
              <li>Content is created and edited through a custom interface</li>
              <li>Posts are stored in the linked Supabase database</li>
              <li>Published content is rendered server-side for optimal performance</li>
              <li>The entire system deploys as a single Next.js application</li>
            </ol>
          </div>
          <p>
            The setup is straightforward: initialize a Next.js project, configure Supabase, create the content schema, and build the editor interface. No microservices, no API gateways, no complex infrastructure.
          </p>
          <div className="mt-6">
            <a
              href="https://github.com/seanrh34/PawPress"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors"
            >
              View Full Implementation on GitHub
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </ContentSection>

        <ContentSection title="Who This Is For">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">Ideal For</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Solo founders building content-driven products</li>
                <li>• Developers who want a free, native CMS experience</li>
                <li>• Projects with straightforward content needs</li>
                <li>• Anyone who values ownership over their stack</li>
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-3">Not Right For</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• High-level website building tools (drag and drop)</li>
                <li>• Complex content models with relationships</li>
                <li>• Projects requiring plugin ecosystems</li>
                <li>• Organizations preferring managed services</li>
              </ul>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="See It In Action" className="border-t border-white/10 pt-16">
          <p>
            Want to see PawPress CMS in production? Check out the live blog powered by this system.
          </p>
          <div className="mt-6 text-center">
            <a
              href="https://blog.34cats.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-[#E84A3A] hover:bg-[#d43d2d] text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:shadow-[#E84A3A]/20"
            >
              Visit Live Demo
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </ContentSection>

        <ContentSection title="Final Thoughts">
          <p>
            Building a custom CMS isn't always the answer, but for focused use cases, it offers clarity and control that off-the-shelf solutions can't match.
          </p>
          <p>
            PawPress CMS trades comprehensive features for simplicity. It works well when your requirements are narrow and ownership matters more than convenience.
          </p>
        </ContentSection>
      </div>
    </div>
  );
}
