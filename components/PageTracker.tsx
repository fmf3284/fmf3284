'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Generate or retrieve anonymous session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_fmf_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_fmf_sid', sid);
  }
  return sid;
}

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin pages
    if (pathname.startsWith('/admin')) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    // Fire and forget — never block the page
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: pathname,
        referrer: document.referrer || null,
        sessionId,
      }),
    }).catch(() => {}); // silently ignore errors

  }, [pathname]);

  return null; // renders nothing
}
