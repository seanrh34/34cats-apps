import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | 34cats",
  description: "Privacy Policy for 34cats applications",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <p className="text-sm text-gray-400 mb-6">
              <strong>Last Updated:</strong> January 3, 2026
            </p>
            <p className="mb-4">
              This Privacy Policy describes how 34cats (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, 
              uses, and protects your personal information when you use our applications and services 
              available at 34cats-apps.pages.dev (the &quot;Service&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white">1.1 Information You Provide</h3>
            <p className="mb-4">
              When you use our Service, particularly our resume builder application (Resumeow), 
              you may provide the following information:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Personal information (name, email address, phone number, location)</li>
              <li>Educational background and qualifications</li>
              <li>Work experience and employment history</li>
              <li>Skills and competencies</li>
              <li>Project details and accomplishments</li>
              <li>Co-curricular activities and achievements</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">1.2 Information from Third-Party Services</h3>
            <p className="mb-4">
              When you sign in using Google OAuth, we receive:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Your Google account email address</li>
              <li>Your Google profile name</li>
              <li>Your Google profile picture (if available)</li>
              <li>Unique identifier from Google</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">1.3 Automatically Collected Information</h3>
            <p className="mb-4">
              We may automatically collect certain technical information:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve our applications</li>
              <li><strong>Resume Generation:</strong> To compile and format your resume in LaTeX and PDF formats</li>
              <li><strong>Authentication:</strong> To verify your identity and manage your account</li>
              <li><strong>Data Storage:</strong> To save your resume data for future access and editing</li>
              <li><strong>Communication:</strong> To respond to your inquiries and provide customer support</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and enhance user experience</li>
              <li><strong>Security:</strong> To protect against unauthorized access and maintain service integrity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Data Storage and Security</h2>
            <p className="mb-4">
              <strong>Storage:</strong> Your data is stored securely using Supabase (PostgreSQL database) 
              with industry-standard encryption and security measures.
            </p>
            <p className="mb-4">
              <strong>Security Measures:</strong> We implement appropriate technical and organizational 
              measures to protect your personal information against unauthorized access, alteration, 
              disclosure, or destruction. However, no method of transmission over the Internet or 
              electronic storage is 100% secure.
            </p>
            <p className="mb-4">
              <strong>Data Retention:</strong> We retain your personal information only for as long as 
              necessary to fulfill the purposes outlined in this Privacy Policy, or as required by law. 
              You can delete your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Service Providers:</strong> With trusted third-party services (Supabase for database hosting, LaTeX.Online for PDF compilation) that assist in operating our Service</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property, and that of our users</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Third-Party Services</h2>
            <p className="mb-4">Our Service integrates with the following third-party services:</p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Google OAuth:</strong> For authentication (governed by Google&apos;s Privacy Policy)</li>
              <li><strong>Supabase:</strong> For data storage and authentication (governed by Supabase&apos;s Privacy Policy)</li>
              <li><strong>LaTeX.Online:</strong> For PDF compilation (governed by LaTeX.Online&apos;s terms)</li>
              <li><strong>Cloudflare Pages:</strong> For hosting and content delivery</li>
            </ul>
            <p className="mb-4">
              These third-party services have their own privacy policies. We encourage you to review 
              their policies before using our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. Your Rights and Choices</h2>
            <p className="mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing at any time</li>
              <li><strong>Opt-Out:</strong> Opt-out of certain data collection and processing activities</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:34cats.dev@gmail.com" className="text-[#E84A3A] hover:underline">
                34cats.dev@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7. Cookies and Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies to enhance your experience. These include:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Functional Cookies:</strong> To remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> To understand how you interact with our Service</li>
            </ul>
            <p className="mb-4">
              You can control cookie preferences through your browser settings, but disabling certain 
              cookies may affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">8. Children&apos;s Privacy</h2>
            <p className="mb-4">
              Our Service is not intended for children under the age of 13. We do not knowingly collect 
              personal information from children under 13. If you become aware that a child has provided 
              us with personal information, please contact us, and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">9. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and maintained on servers located outside of your 
              state, province, country, or other governmental jurisdiction where data protection laws 
              may differ. By using our Service, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">10. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. 
              You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">11. Contact Us</h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our 
              data practices, please contact us:
            </p>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <p className="mb-2">
                <strong className="text-white">Email:</strong>{" "}
                <a href="mailto:34cats.dev@gmail.com" className="text-[#E84A3A] hover:underline">
                  34cats.dev@gmail.com
                </a>
              </p>
              <p className="mb-2">
                <strong className="text-white">Website:</strong>{" "}
                <a href="https://34cats.com" target="_blank" rel="noopener noreferrer" className="text-[#E84A3A] hover:underline">
                  https://34cats.com
                </a>
              </p>
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              By using our Service, you acknowledge that you have read and understood this Privacy 
              Policy and agree to its terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
