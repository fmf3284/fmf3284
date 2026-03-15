'use client';

/**
 * NewsletterBanner — two modes:
 *
 * LOGGED-IN USER (newsletterSubscribed=false):
 *   - Shows every 24h
 *   - "Ignore" → dismiss for 24h, repeat forever
 *   - "Remind in a month" → snooze 30 days, then back to 24h cycle
 *   - Stored per-user in localStorage so multiple accounts don't conflict
 *
 * VISITOR (not logged in):
 *   - Shows every single visit (no snooze stored)
 *   - "Ignore" → just hides for this page session only (closes the banner)
 *   - No "Remind in a month" option
 *   - Can still subscribe by entering their email
 */

import { useState, useEffect, useRef } from 'react';

interface NewsletterBannerProps {
  // If provided = logged-in user mode. If null/undefined = visitor mode.
  userEmail?: string | null;
  userName?: string | null;
}

export default function NewsletterBanner({ userEmail, userName }: NewsletterBannerProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState(userEmail || '');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoggedIn = !!userEmail;
  const storageKey = isLoggedIn ? `nl_snooze_${userEmail}` : null;

  useEffect(() => {
    if (isLoggedIn && storageKey) {
      try {
        const snoozeUntil = localStorage.getItem(storageKey);
        if (snoozeUntil && new Date(snoozeUntil) > new Date()) return;
        if (snoozeUntil) localStorage.removeItem(storageKey);
      } catch { /* no localStorage */ }
    }
    // Visitors: always show. Logged-in: show if not snoozed.
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [isLoggedIn, storageKey]);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: userName || undefined,
          source: isLoggedIn ? 'dashboard_banner' : 'visitor_banner',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
        if (isLoggedIn && storageKey) {
          try { localStorage.removeItem(storageKey); } catch { /* no-op */ }
        }
        setTimeout(() => setVisible(false), 3500);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleMute = () => {
    // Logged-in only: snooze 30 days then resume 24h cycle
    if (isLoggedIn && storageKey) {
      try {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        localStorage.setItem(storageKey, d.toISOString());
      } catch { /* no-op */ }
    }
    setVisible(false);
  };

  const handleIgnore = () => {
    if (isLoggedIn && storageKey) {
      // Logged-in: snooze 24h — shows again next visit after 24h, forever
      try {
        const d = new Date();
        d.setHours(d.getHours() + 24);
        localStorage.setItem(storageKey, d.toISOString());
      } catch { /* no-op */ }
    }
    // Visitor: just close for this session, will show again on next visit
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop blur overlay — subtle */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(1px)' }}
        aria-hidden="true"
      />

      {/* Banner — fixed bottom center */}
      <div
        className="fixed bottom-6 left-1/2 z-50 w-full max-w-xl px-4"
        style={{ transform: 'translateX(-50%)' }}
        role="dialog"
        aria-label="Newsletter subscription"
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1035 0%, #1e1040 50%, #130d2e 100%)',
            border: '1px solid rgba(139,92,246,0.4)',
            boxShadow: '0 8px 40px rgba(139,92,246,0.25), 0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {/* Glow strip at top */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)' }}
          />

          {/* Animated background orb */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />

          <div className="relative p-5">
            {subscribed ? (
              /* Success state */
              <div className="flex items-center gap-4 py-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-base">You&apos;re in! 🎉</p>
                  <p className="text-emerald-400 text-sm">Check your inbox for a welcome email.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Top row: icon + text + close */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {isLoggedIn
                          ? `Hey ${userName?.split(' ')[0] || 'there'} — stay in the loop! 💪`
                          : 'Get free fitness tips & deals 💪'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        {isLoggedIn
                          ? 'Exclusive deals, new locations, and weekly fitness tips — straight to your inbox.'
                          : 'Join thousands of fitness enthusiasts. No spam, unsubscribe anytime.'}
                      </p>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={handleIgnore}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                    title={isLoggedIn ? 'Ignore — remind me in 24 hours' : 'Ignore'}
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Email input + subscribe */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {!isLoggedIn && (
                      <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                        placeholder="your@email.com"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(139,92,246,0.3)',
                        }}
                      />
                    )}
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 whitespace-nowrap"
                      style={{
                        background: subscribing
                          ? 'rgba(139,92,246,0.5)'
                          : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        boxShadow: subscribing ? 'none' : '0 4px 15px rgba(139,92,246,0.4)',
                        flex: isLoggedIn ? '1' : 'none',
                      }}
                    >
                      {subscribing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Subscribing...
                        </span>
                      ) : '✉️ Subscribe — it\'s free'}
                    </button>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-red-400 text-xs px-1">{error}</p>
                  )}

                  {/* Bottom actions */}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-600 text-xs">
                      {isLoggedIn ? '📅 Shows every 24h until you subscribe' : '🔒 No spam, ever.'}
                    </p>
                    {isLoggedIn && (
                      <button
                        onClick={handleMute}
                        className="text-gray-500 hover:text-gray-300 text-xs transition-colors underline underline-offset-2 decoration-dotted"
                      >
                        Remind in a month
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
