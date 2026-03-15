'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import NewsletterBanner from '@/components/NewsletterBanner';
import { apiGet } from '@/lib/api';
import { SkeletonDashboard } from '@/components/Skeleton';

interface SavedLocation {
  id: string;
  name: string;
  category: string;
  rating: number;
  image: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role?: string; newsletterSubscribed?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiGet('/api/auth/session');

        if (!data.authenticated) {
          router.push('/login');
          return;
        }
        // Fetch saved locations (bookmarks)
        try {
          const bookmarksRes = await apiGet('/api/bookmarks');
          if (bookmarksRes?.bookmarks) {
            setSavedLocations(bookmarksRes.bookmarks);
          }
        } catch (e) {
          console.error('Failed to load bookmarks:', e);
        }

        setUser({ name: data.user.name, email: data.user.email, role: data.user.role, newsletterSubscribed: data.user.newsletterSubscribed || false });
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="content-wrapper">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-violet-500 text-xl">Loading...</div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        {/* Newsletter subscription banner — only shown to non-subscribers */}
        {/* Newsletter banner — shows every 24h for non-subscribed users */}
        {user && !user.newsletterSubscribed && (
          <NewsletterBanner userEmail={user.email} userName={user.name || undefined} />
        )}

        <h1>Welcome, {user.name}!</h1>
        <p>Your personalized fitness dashboard</p>
      </section>

      {/* Dashboard Content */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto px-4">
          {/* User Info Card */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-violet-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white font-semibold">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-violet-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-semibold">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <LogoutButton />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-violet-500 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Saved Locations</h3>
                <div className="bg-violet-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-violet-500">{savedLocations.length}</p>
              <p className="text-gray-400 text-sm mt-2">Fitness locations you've bookmarked</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-violet-500 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Check-ins</h3>
                <div className="bg-violet-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-violet-500">0</p>
              <p className="text-gray-400 text-sm mt-2">Total workout sessions logged</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-violet-500 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Membership</h3>
                <div className="bg-violet-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-violet-500">Free</p>
              <p className="text-gray-400 text-sm mt-2">Upgrade to unlock more features</p>
            </div>
          </div>

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Your Saved Locations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedLocations.map((location) => (
                  <div
                    key={location.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-violet-500 transition-all duration-300 flex items-center space-x-4"
                  >
                    <div className="text-4xl">{location.image}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{location.name}</h3>
                      <p className="text-gray-400 text-sm">{location.category}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <svg className="w-4 h-4 text-violet-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-violet-500 text-sm font-semibold">{location.rating}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="text-center py-12">
              <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400">No recent activity yet</p>
              <p className="text-gray-500 text-sm mt-2">Start exploring fitness locations to see your activity here</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
