'use client';

export default function PrivacyPage() {
  return (
    <main className="content-wrapper">
      <section className="py-16 bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Effective Date: February 11, 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <p className="text-gray-300 text-lg">
              FindMyFitness ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information.
            </p>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p className="text-gray-300 mb-3">We may collect:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Name and email address</li>
                <li>Account login information</li>
                <li>Payment information (processed securely via third-party providers)</li>
                <li>Usage data (searches, interactions, preferences)</li>
                <li>Device and browser information</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Information</h2>
              <p className="text-gray-300 mb-3">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Provide and improve the Service</li>
                <li>Process payments</li>
                <li>Send account and transactional emails</li>
                <li>Personalize user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">3. Sharing of Information</h2>
              <p className="text-violet-400 font-medium mb-3">We do not sell your personal information.</p>
              <p className="text-gray-300 mb-3">We may share data with:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Service providers (payment processors, email services)</li>
                <li>Legal authorities if required by law</li>
                <li>Business partners only as necessary to provide the Service</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">4. Cookies & Tracking</h2>
              <p className="text-gray-300">
                We use cookies and similar technologies to improve functionality and analytics.
              </p>
              <p className="text-gray-300 mt-3">
                You may control cookies through your browser settings.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p className="text-gray-300">
                We implement reasonable technical and organizational safeguards to protect your information. However, no system is 100% secure.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
              <p className="text-gray-300">
                We retain personal information only as long as necessary to provide the Service or meet legal obligations.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
              <p className="text-gray-300 mb-3">You may:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Access or update your information</li>
                <li>Request deletion of your account</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Links</h2>
              <p className="text-gray-300">
                Our Service may link to third-party websites. We are not responsible for their privacy practices.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p className="text-gray-300">
                FindMyFitness is not intended for children under 13. We do not knowingly collect data from children.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy periodically. Continued use of the Service constitutes acceptance.
              </p>
            </div>

            <div className="bg-violet-900/30 rounded-xl p-6 border border-violet-700">
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
              <p className="text-gray-300 mb-3">
                For privacy-related questions, contact us at:
              </p>
              <div className="space-y-2">
                <a href="mailto:support@findmyfitness.fit" className="text-violet-400 hover:text-violet-300 text-lg font-medium block">
                  📧 support@findmyfitness.fit
                </a>
                <a href="tel:+12088187141" className="text-violet-400 hover:text-violet-300 text-lg font-medium block">
                  📞 (208) 818-7141
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
