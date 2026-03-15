'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'newsletter_banner_muted_until';

interface NewsletterBannerProps {
  userEmail: string;
  userName?: string;
}

export default function NewsletterBanner({ userEmail, userName }: NewsletterBannerProps) {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Check if user muted the banner
    try {
      const mutedUntil = localStorage.getItem(STORAGE_KEY);
      if (mutedUntil) {
        const mutedDate = new Date(mutedUntil);
        if (mutedDate > new Date()) {
          // Still muted — don't show
          return;
        }
        // Mute expired — clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* localStorage not available */ }

    // Show banner after a short delay so page loads first
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

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
        // Hide after 3 seconds
        setTimeout(() => setVisible(false), 3000);
      }
    } catch { /* non-blocking */ }
    finally { setSubscribing(false); }
  };

  const handleMute = () => {
    try {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      localStorage.setItem(STORAGE_KEY, oneMonthFromNow.toISOString());
    } catch { /* non-blocking */ }
    setVisible(false);
  };

  const handleDismiss = () => {
    // Dismiss for this session only (24h — they'll see it again on next login)
    try {
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      localStorage.setItem(STORAGE_KEY, tomorrow.toISOString());
    } catch { /* non-blocking */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <div className="mb-6 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-900/30 to-purple-900/20 p-4">
        {subscribed ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-white font-semibold">You're subscribed!</p>
              <p className="text-violet-300 text-sm">Welcome to the Find My Fitness newsletter.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left — message */}
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

            {/* Right — actions */}
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
                title="Don't show this for 1 month"
              >
                Remind in a month
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded"
                title="Dismiss for today"
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
