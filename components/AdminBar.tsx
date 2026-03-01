'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();

    // Re-check on focus (when user returns to tab)
    const handleFocus = () => checkAdmin();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (!isAdmin) return null;

  const isAdminPage = pathname?.startsWith('/admin');

  if (isMinimized) {
    return (
      <>
        {/* Spacer for minimized bar */}
        <div className="h-2" />
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-violet-900 to-violet-700 h-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="absolute right-4 top-0 bg-violet-600 text-white text-xs px-3 py-1 rounded-b hover:bg-violet-500 transition-colors font-semibold"
          >
            ▼ Show Admin Bar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Spacer to push content below the fixed admin bar */}
      <div className="h-12" />
      
      {/* Fixed Admin Bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-violet-900 via-purple-800 to-violet-700 text-white shadow-xl border-b-2 border-yellow-400/50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-sm flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
              <span className="text-yellow-400 text-lg">⚡</span> 
              <span className="text-yellow-300">ADMIN MODE</span>
            </span>
            
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link 
                href="/admin" 
                className={`px-3 py-1.5 rounded-lg transition-all ${pathname === '/admin' ? 'bg-yellow-500/30 text-yellow-300 font-semibold' : 'hover:bg-white/10'}`}
              >
                📊 Dashboard
              </Link>
              <Link 
                href="/admin/users" 
                className={`px-3 py-1.5 rounded-lg transition-all ${pathname === '/admin/users' ? 'bg-yellow-500/30 text-yellow-300 font-semibold' : 'hover:bg-white/10'}`}
              >
                👥 Users
              </Link>
              <Link 
                href="/admin/profiles" 
                className={`px-3 py-1.5 rounded-lg transition-all ${pathname?.startsWith('/admin/profiles') ? 'bg-yellow-500/30 text-yellow-300 font-semibold' : 'hover:bg-white/10'}`}
              >
                📋 Profiles
              </Link>
              <Link 
                href="/admin/reviews" 
                className={`px-3 py-1.5 rounded-lg transition-all ${pathname === '/admin/reviews' ? 'bg-yellow-500/30 text-yellow-300 font-semibold' : 'hover:bg-white/10'}`}
              >
                ⭐ Reviews
              </Link>
              <Link 
                href="/admin/logs" 
                className={`px-3 py-1.5 rounded-lg transition-all ${pathname === '/admin/logs' ? 'bg-yellow-500/30 text-yellow-300 font-semibold' : 'hover:bg-white/10'}`}
              >
                🕐 Logs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!isAdminPage && (
              <Link 
                href="/admin"
                className="bg-yellow-500 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors shadow-lg"
              >
                Go to Admin →
              </Link>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white/70 hover:text-white text-lg transition-colors px-2"
              title="Minimize admin bar"
            >
              ▲
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
