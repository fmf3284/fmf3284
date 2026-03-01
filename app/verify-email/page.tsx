'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          setUserName(data.userName || '');
        } else {
          // Check if it's an expiration error
          if (data.error?.includes('expired')) {
            setStatus('expired');
            setMessage('Your verification link has expired.');
          } else {
            setStatus('error');
            setMessage(data.error || 'Verification failed.');
          }
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main className="content-wrapper">
      <section className="py-16 bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-gray-900 min-h-[70vh] flex items-center">
        <div className="max-w-lg mx-auto px-4 text-center">
          {status === 'verifying' && (
            <>
              <div className="animate-spin w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-white mb-4">Verifying Your Email...</h1>
              <p className="text-gray-400">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">🎉 Email Verified!</h1>
              {userName && (
                <p className="text-xl text-violet-400 mb-4">Welcome, {userName}!</p>
              )}
              <p className="text-gray-400 mb-6">{message}</p>
              
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6 mb-6">
                <p className="text-green-400 font-medium mb-2">✅ Your account is now active!</p>
                <p className="text-gray-400 text-sm">
                  You can now log in to Find My Fitness and start exploring fitness locations near you.
                </p>
              </div>

              <Link 
                href="/login"
                className="inline-block px-8 py-3 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-lg transition-all"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="bg-amber-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">⏰ Link Expired</h1>
              <p className="text-gray-400 mb-2">{message}</p>
              <p className="text-amber-400/80 text-sm mb-6">
                Verification links expire after 15 minutes for security.
              </p>
              
              <div className="space-y-4">
                <Link 
                  href="/verify-pending"
                  className="inline-block w-full px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-lg transition-all"
                >
                  📧 Get New Verification Link
                </Link>
                
                <div>
                  <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Login
                  </Link>
                </div>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              
              <div className="space-y-3">
                <Link 
                  href="/verify-pending"
                  className="inline-block px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-lg transition-all"
                >
                  Request New Verification Link
                </Link>
                
                <div>
                  <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="content-wrapper">
        <section className="py-16 bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-gray-900 min-h-[70vh] flex items-center">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
          </div>
        </section>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
