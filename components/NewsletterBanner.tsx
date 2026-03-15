'use client';

/**
 * NewsletterBanner
 *
 * Only renders on the dashboard for logged-in users who are NOT subscribed.
 * Visitors and guests never see this — the parent (dashboard) only renders it
 * when user.newsletterSubscribed === false.
 *
 * Repeat cycle (stored per user in localStorage):
 *  X Dismiss          → hide 24 hours, then show again next visit after that
 *  "Remind in a month" → hide 30 days, then resume 24h cycle forever
 *  Both repeat indefinitely until the user subscribes.
 */

import { useState, useEffect } from 'react';

interface NewsletterBannerProps {
  userEmail: string;
  userName?: string;
}

export default function NewsletterBanner({ userEmail, userName }: NewsletterBannerProps) {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Per-user key so multiple accounts on same browser don't interfere
  const storageKey = `newsletter_snooze_${userEmail}`;

  useEffect(() => {
    try {
      const snoozeUntil = localStorage.getItem(storageKey);
      if (snoozeUntil && new Date(snoozeUntil) > new Date()) {
        return; // still snoozed
      }
      if (snoozeUntil) localStorage.removeItem(storageKey); // expired, clear it
    } catch { /* localStorage unavailable */ }

    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [storageKey]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: userName, source: 'dashboard_banner' }),
      });
      if (res.ok) {
        setSubscribed(true);
        try { localStorage.removeItem(storageKey); } catch { /* non-blocking */ }
        setTimeout(() => setVisible(false), 3000);
      }
    } catch { /* non-blocking */ }
    finally { setSubscribing(false); }
  };

  const handleMute = () => {
    // Snooze 30 days — after that resumes 24h cycle
    try {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      localStorage.setItem(storageKey, d.toISOString());
    } catch { /* non-blocking */ }
    setVisible(false);
  };

  const handleDismiss = () => {
    // Snooze 24h — shows again next visit after 24h, repeats forever
    try {
      const d = new Date();
      d.setHours(d.getHours() + 24);
      localStorage.setItem(storageKey, d.toISOString());
    } catch { /* non-blocking */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-6">
      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-900/30 to-purple-900/20 p-4">
        {subscribed ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-white font-semibold">You&apos;re subscribed!</p>
              <p className="text-violet-300 text-sm">Welcome to the Find My Fitness newsletter.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">📧</span>
              <div>
                <p className="text-white font-semibold text-sm">
                  Stay in the loop, {userName?.split(' ')[0] || 'there'}!
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Get fitness tips, exclusive deals, and new locations near you — straight to your inbox.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all whitespace-nowrap"
              >
                {subscribing ? '...' : '✉️ Subscribe'}
              </button>
              <button
                onClick={handleMute}
                className="px-3 py-2 text-gray-400 hover:text-gray-200 text-xs rounded-lg hover:bg-white/5 transition-all whitespace-nowrap"
                title="Hide for 30 days then remind again"
              >
                Remind in a month
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded"
                title="Dismiss — show again in 24 hours"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
