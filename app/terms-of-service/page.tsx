import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | 34cats",
  description: "Terms of Service for 34cats applications",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-black text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-white">Terms of Service</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <p className="text-sm text-gray-400 mb-6">
              <strong>Last Updated:</strong> January 3, 2026
            </p>
            <p className="mb-4">
              Welcome to 34cats. These Terms of Service (&quot;Terms&quot;) govern your access to and use of 
              our applications and services available at 34cats-apps.pages.dev (the &quot;Service&quot;). 
              By accessing or using the Service, you agree to be bound by these Terms.
            </p>
            <p className="mb-4">
              If you do not agree to these Terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By creating an account, accessing, or using our Service, you confirm that:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>You are at least 13 years of age</li>
              <li>You have the legal capacity to enter into these Terms</li>
              <li>You will comply with all applicable laws and regulations</li>
              <li>All information you provide is accurate and truthful</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Description of Service</h2>
            <p className="mb-4">
              34cats provides web-based applications, including but not limited to:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Resumeow:</strong> A resume builder that allows users to create, edit, and download professional resumes in PDF format</li>
              <li><strong>PawPress CMS:</strong> A content management system for blogs and websites</li>
              <li><strong>Future Applications:</strong> Additional tools and services that may be added over time</li>
            </ul>
            <p className="mb-4">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any 
              time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white">3.1 Account Creation</h3>
            <p className="mb-4">
              To access certain features of the Service, you must create an account using Google OAuth 
              authentication. You are responsible for:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">3.2 Account Termination</h3>
            <p className="mb-4">
              We reserve the right to suspend or terminate your account at our discretion if:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>You violate these Terms</li>
              <li>You engage in fraudulent or illegal activities</li>
              <li>You abuse or misuse the Service</li>
              <li>Your account remains inactive for an extended period</li>
            </ul>
            <p className="mb-4">
              You may delete your account at any time through the Service interface or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. User Content and Data</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white">4.1 Your Content</h3>
            <p className="mb-4">
              You retain all rights to the content you create using our Service, including resumes, 
              personal information, and other data (&quot;User Content&quot;). By using the Service, you grant 
              us a limited, non-exclusive license to:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Store and process your User Content to provide the Service</li>
              <li>Generate PDF documents from your resume data</li>
              <li>Display your User Content back to you within the Service</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">4.2 Content Responsibility</h3>
            <p className="mb-4">You represent and warrant that:</p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>You own or have the necessary rights to all User Content you submit</li>
              <li>Your User Content does not infringe on third-party intellectual property rights</li>
              <li>Your User Content is accurate and not misleading</li>
              <li>Your User Content does not contain illegal, harmful, or offensive material</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">4.3 Data Backup</h3>
            <p className="mb-4">
              While we implement reasonable data backup procedures, you are responsible for maintaining 
              your own backup copies of important User Content. We are not liable for any loss of data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Acceptable Use Policy</h2>
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload viruses, malware, or other malicious code</li>
              <li>Scrape, crawl, or harvest data from the Service without permission</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Abuse, harass, threaten, or intimidate other users</li>
              <li>Use automated systems to access the Service without our consent</li>
              <li>Reverse engineer or attempt to extract source code from the Service</li>
              <li>Remove or alter any copyright, trademark, or proprietary notices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white">6.1 Our Property</h3>
            <p className="mb-4">
              The Service, including its design, features, functionality, source code, graphics, logos, 
              and all related intellectual property, is owned by 34cats and protected by copyright, 
              trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white">6.2 Limited License</h3>
            <p className="mb-4">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and 
              use the Service for personal, non-commercial purposes, subject to these Terms.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white">6.3 Trademarks</h3>
            <p className="mb-4">
              &quot;34cats&quot;, &quot;Resumeow&quot;, and related logos are trademarks of 34cats. You may not use 
              these trademarks without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7. Third-Party Services</h2>
            <p className="mb-4">
              Our Service integrates with third-party services including Google OAuth, Supabase, 
              LaTeX.Online, and Cloudflare Pages. Your use of these services is subject to their 
              respective terms and privacy policies. We are not responsible for:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>The availability or performance of third-party services</li>
              <li>The content or practices of third-party services</li>
              <li>Any losses resulting from your use of third-party services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">8. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white">8.1 Service &quot;AS IS&quot;</h3>
            <p className="mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
              WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
              FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white">8.2 No Guarantee</h3>
            <p className="mb-4">We do not guarantee that:</p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The results obtained from using the Service will be accurate or reliable</li>
              <li>Any errors or defects will be corrected</li>
              <li>The Service will meet your specific requirements</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">8.3 Limitation of Liability</h3>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL 34CATS BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT 
              LIMITED TO LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR 
              RELATED TO YOUR USE OF THE SERVICE.
            </p>
            <p className="mb-4">
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR 
              THE SERVICE SHALL NOT EXCEED $100 USD OR THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, 
              WHICHEVER IS GREATER.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">9. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless 34cats, its affiliates, and their 
              respective officers, directors, employees, and agents from any claims, liabilities, 
              damages, losses, costs, or expenses (including reasonable attorneys&apos; fees) arising out of:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your User Content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">10. Privacy</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our{" "}
              <a href="/privacy-policy" className="text-[#E84A3A] hover:underline">
                Privacy Policy
              </a>{" "}
              to understand how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">11. Modifications to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material 
              changes by posting the updated Terms on this page and updating the &quot;Last Updated&quot; date. 
              Your continued use of the Service after such modifications constitutes your acceptance of 
              the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">12. Termination</h2>
            <p className="mb-4">
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Your right to use the Service immediately ceases</li>
              <li>We may delete your account and User Content</li>
              <li>You remain responsible for any obligations incurred before termination</li>
              <li>Provisions that by their nature should survive termination will continue to apply</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">13. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the 
              jurisdiction where 34cats operates, without regard to its conflict of law provisions.
            </p>
            <p className="mb-4">
              Any disputes arising from these Terms or the Service shall first be attempted to be 
              resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved 
              through binding arbitration or in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">14. Severability</h2>
            <p className="mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining 
              provisions shall continue to be valid and enforceable to the fullest extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">15. Entire Agreement</h2>
            <p className="mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between 
              you and 34cats regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">16. Contact Information</h2>
            <p className="mb-4">
              If you have any questions, concerns, or feedback regarding these Terms, please contact us:
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
              By using our Service, you acknowledge that you have read, understood, and agree to be 
              bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
