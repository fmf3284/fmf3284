'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I find fitness locations near me?',
      answer: 'Use our Locations page to search by category, city, or keyword. You can filter results and save your favorite locations to your dashboard.',
    },
    {
      question: 'How do membership plans work?',
      answer: 'Browse thousands of gyms, yoga studios, personal trainers, and more for free. Create a free account to save your favorite locations and write reviews.',
    },
    {
      question: 'Can I cancel my membership anytime?',
      answer: 'Yes! All our memberships are month-to-month with no long-term contracts. You can cancel anytime from your dashboard.',
    },
    {
      question: 'How do I list my gym or studio?',
      answer: 'Contact us at support@findmyfitness.fit with your business details and we will add your location to our directory.',
    },
    {
      question: 'What if I have technical issues?',
      answer: 'Contact our support team through the Contact page or email support@fitnessfinder.com. We typically respond within 24 hours.',
    },
  ];

  return (
    <main className="content-wrapper">
      <section className="splash-screen">
        <h1>Help Center</h1>
        <p>Find answers to common questions</p>
      </section>

      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 bg-gray-900 hover:bg-gray-700 text-left flex items-center justify-between transition-all"
                  >
                    <span className="text-white font-semibold">{faq.question}</span>
                    <span className="text-violet-500 text-2xl">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 py-4 bg-gray-800 text-gray-300">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center hover:border-violet-500 transition-all">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-white font-bold mb-2">Email Support</h3>
              <p className="text-gray-400 text-sm mb-4">Get help via email</p>
              <Link href="/contact" className="text-violet-500 hover:text-violet-600 font-semibold">
                Contact Us
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center hover:border-violet-500 transition-all">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-white font-bold mb-2">Documentation</h3>
              <p className="text-gray-400 text-sm mb-4">Read our guides</p>
              <Link href="/about" className="text-violet-500 hover:text-violet-600 font-semibold">
                Learn More
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center hover:border-violet-500 transition-all">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-white font-bold mb-2">Community</h3>
              <p className="text-gray-400 text-sm mb-4">Join discussions</p>
              <Link href="/contact" className="text-violet-500 hover:text-violet-600 font-semibold">
                Ask Questions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
