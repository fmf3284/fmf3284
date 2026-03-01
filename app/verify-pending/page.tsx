'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VerifyPendingPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Cooldown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!canResend) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ New verification email sent! Check your inbox.');
        // Start 60 second cooldown
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-gray-900 min-h-screen">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="bg-violet-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Check Your Email 📧
          </h1>
          
          <p className="text-gray-400 text-lg mb-4">
            We've sent a verification link to your email address. 
            Please click the link to activate your account.
          </p>

          {/* Warning Box - 15 Minutes */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Link expires in 15 minutes!</span>
            </div>
            <p className="text-amber-300/70 text-sm mt-1">
              If it expires, use the form below to get a new link
            </p>
          </div>

          {/* Resend Form */}
          <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30 mb-8">
            <h3 className="text-white font-semibold mb-2">Didn't receive it? Link expired?</h3>
            <p className="text-gray-500 text-sm mb-4">Enter your email to get a new verification link</p>
            
            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              {message && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canResend}
                className="w-full px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : countdown > 0 ? (
                  `Wait ${countdown}s to resend`
                ) : (
                  '📧 Send New Verification Email'
                )}
              </button>
            </form>
          </div>

          {/* Tips */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <h4 className="text-white font-medium mb-2">💡 Tips</h4>
            <ul className="text-gray-400 text-sm text-left space-y-1">
              <li>• Check your <strong>spam/junk</strong> folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Add our email to your contacts</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
