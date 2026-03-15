'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'resubscribed'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleUnsubscribe = async () => {
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'You have been unsubscribed.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleResubscribe = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'resubscribe' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('resubscribed');
        setMessage("You're back! We'll keep you updated.");
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to resubscribe.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1035 0%, #1e1040 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 20px 60px rgba(139,92,246,0.15)',
          }}
        >
          {/* Top glow */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)' }} />

          <div className="p-8">

            {status === 'success' ? (
              /* Unsubscribed state */
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Unsubscribed</h1>
                <p className="text-gray-400 text-sm mb-2">{message}</p>
                <p className="text-gray-500 text-xs mb-8">
                  <span className="font-medium text-gray-400">{email}</span> has been removed from our list.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleResubscribe}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-violet-300 transition-all hover:text-white"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}
                  >
                    Changed your mind? Re-subscribe
                  </button>
                  <Link href="/"
                    className="block w-full py-3 rounded-xl text-sm font-semibold text-gray-400 text-center hover:text-white transition-colors">
                    ← Back to Find My Fitness
                  </Link>
                </div>
              </div>

            ) : status === 'resubscribed' ? (
              /* Re-subscribed state */
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Welcome back! 🎉</h1>
                <p className="text-gray-400 text-sm mb-8">{message}</p>
                <Link href="/"
                  className="block w-full py-3 rounded-xl text-sm font-semibold text-white text-center transition-all"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  ← Back to Find My Fitness
                </Link>
              </div>

            ) : (
              /* Default — unsubscribe form */
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Unsubscribe</h1>
                  <p className="text-gray-400 text-sm">
                    We&apos;re sorry to see you go. Enter your email below to unsubscribe from the Find My Fitness newsletter.
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setStatus('idle'); setMessage(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleUnsubscribe()}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(139,92,246,0.25)',
                      }}
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-red-400 text-sm">{message}</p>
                  )}

                  <button
                    onClick={handleUnsubscribe}
                    disabled={status === 'loading'}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                    style={{
                      background: status === 'loading'
                        ? 'rgba(239,68,68,0.4)'
                        : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      boxShadow: status === 'loading' ? 'none' : '0 4px 15px rgba(220,38,38,0.3)',
                    }}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Processing...
                      </span>
                    ) : 'Unsubscribe me'}
                  </button>

                  <Link href="/"
                    className="block text-center text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    ← Keep my subscription & go back
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          © {new Date().getFullYear()} Find My Fitness ·{' '}
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
