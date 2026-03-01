'use client';

import { useState } from 'react';

export default function AffiliatePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    website: '',
    socialMedia: '',
    audienceSize: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch {
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="content-wrapper">
        <section className="py-20 bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-gray-900 min-h-screen">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="bg-green-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Application Submitted!</h1>
            <p className="text-gray-400 mb-6">
              Thank you for your interest in becoming a Find My Fitness affiliate. 
              Our team will review your application and get back to you within 2-3 business days.
            </p>
            <a 
              href="/"
              className="inline-block px-8 py-3 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-lg transition-all"
            >
              Back to Home
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="content-wrapper">
      {/* Hero */}
      <section className="splash-screen">
        <h1>Become an Affiliate</h1>
        <p>Partner with us and earn while helping people find their perfect fitness spot</p>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Partner With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-3">Competitive Commissions</h3>
              <p className="text-gray-400">Earn up to 30% commission on every referral that signs up for a premium membership.</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Dashboard</h3>
              <p className="text-gray-400">Track your referrals, earnings, and performance with our comprehensive affiliate dashboard.</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-white mb-3">Dedicated Support</h3>
              <p className="text-gray-400">Get personalized support and marketing materials to help you succeed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Apply Now</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Business/Brand Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                  placeholder="Fitness Blog Inc."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                  placeholder="https://yoursite.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Social Media Handles</label>
                <input
                  type="text"
                  value={form.socialMedia}
                  onChange={(e) => setForm({ ...form, socialMedia: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                  placeholder="@yourhandle on Instagram/TikTok"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">Audience Size</label>
              <select
                value={form.audienceSize}
                onChange={(e) => setForm({ ...form, audienceSize: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="">Select your audience size</option>
                <option value="1-1000">1 - 1,000 followers</option>
                <option value="1000-10000">1,000 - 10,000 followers</option>
                <option value="10000-50000">10,000 - 50,000 followers</option>
                <option value="50000-100000">50,000 - 100,000 followers</option>
                <option value="100000+">100,000+ followers</option>
              </select>
            </div>

            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">Why do you want to become an affiliate?</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                rows={4}
                placeholder="Tell us about yourself and why you'd be a great fit..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-8 px-8 py-4 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition-all"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
