'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmailFormData {
  recipientEmail: string;
  subject: string;
  message: string;
  senderName: string;
  category: string;
}

export default function EmailSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<EmailFormData>({
    recipientEmail: '',
    subject: '',
    message: '',
    senderName: '',
    category: 'general',
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (!data.authenticated) {
          router.push('/login');
          return;
        }

        setUser(data.user);
        setFormData(prev => ({
          ...prev,
          senderName: data.user.name,
        }));
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setSuccess(true);
      // Reset form
      setFormData({
        recipientEmail: '',
        subject: '',
        message: '',
        senderName: user?.name || '',
        category: 'general',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="content-wrapper">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-violet-500 text-xl">Loading...</div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="content-wrapper">
        <section className="splash-screen">
          <h1>Email Sent!</h1>
          <p>Your message has been sent successfully</p>
        </section>
        <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="bg-violet-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300 mb-6">Redirecting to dashboard...</p>
              <Link
                href="/dashboard"
                className="text-violet-500 hover:text-violet-600 font-semibold"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Compose Email</h1>
        <p>Send a message to fitness locations or trainers</p>
      </section>

      {/* Email Form Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-8">Email Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Sender Name */}
              <div>
                <label htmlFor="senderName" className="block text-white font-medium mb-2">
                  Your Name <span className="text-violet-500">*</span>
                </label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Recipient Email */}
              <div>
                <label htmlFor="recipientEmail" className="block text-white font-medium mb-2">
                  Recipient Email <span className="text-violet-500">*</span>
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  placeholder="recipient@example.com"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-white font-medium mb-2">
                  Category <span className="text-violet-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                >
                  <option value="general">General Inquiry</option>
                  <option value="membership">Membership Question</option>
                  <option value="training">Personal Training</option>
                  <option value="class">Class Information</option>
                  <option value="facility">Facility Question</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-white font-medium mb-2">
                  Subject <span className="text-violet-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter email subject"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-white font-medium mb-2">
                  Message <span className="text-violet-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message here..."
                  required
                  rows={8}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-vertical"
                />
                <p className="text-gray-500 text-sm mt-2">
                  {formData.message.length} characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? 'Sending...' : 'Send Email'}
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center border border-gray-600"
                >
                  Cancel
                </Link>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex items-start space-x-3">
                <div className="bg-violet-500 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">
                    This email will be sent from your registered email address: <span className="text-white font-semibold">{user?.email}</span>
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Make sure to include all relevant information in your message.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
