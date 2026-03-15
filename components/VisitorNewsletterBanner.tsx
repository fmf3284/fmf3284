'use client';

import { useState, useEffect } from 'react';
import NewsletterBanner from './NewsletterBanner';

/**
 * VisitorNewsletterBanner
 * Rendered in the layout so it shows on ALL pages.
 * Checks session — if user is logged in, don't show (dashboard handles it for them).
 * If not logged in, show the visitor version of the banner every visit.
 */
export default function VisitorNewsletterBanner() {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        // Only show for non-logged-in visitors
        if (!data.authenticated) {
          setShow(true);
        }
      } catch {
        // If session check fails, assume visitor
        setShow(true);
      } finally {
        setChecked(true);
      }
    };
    check();
  }, []);

  if (!checked || !show) return null;

  return <NewsletterBanner userEmail={null} userName={null} />;
}
