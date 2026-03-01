'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Welcome to Find My Fitness!</h1>
        <p>Let's get you started on your fitness journey</p>
      </section>

      {/* Welcome Content */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4">
          {/* Welcome Message */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-8 text-center">
            <div className="bg-violet-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              You're all set, {user?.name}!
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Your account has been created successfully. Explore our features to find the perfect fitness location for you.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300 transform hover:scale-105">
              <div className="bg-violet-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-3">Discover Locations</h3>
              <p className="text-gray-400 text-center">
                Find gyms, yoga studios, personal trainers, and more near you
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300 transform hover:scale-105">
              <div className="bg-violet-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-3">Save Favorites</h3>
              <p className="text-gray-400 text-center">
                Bookmark your favorite fitness spots for quick access
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300 transform hover:scale-105">
              <div className="bg-violet-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-3">Track Progress</h3>
              <p className="text-gray-400 text-center">
                Log your check-ins and monitor your fitness journey
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white text-center mb-8">What would you like to do?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Link
                href="/"
                className="bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold py-6 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center text-lg"
              >
                Explore Fitness Locations
              </Link>
              <Link
                href="/dashboard"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-6 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center border border-gray-600 text-lg"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">
              Need help getting started?
            </p>
            <Link
              href="/contact"
              className="text-violet-500 hover:text-violet-600 font-semibold transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}