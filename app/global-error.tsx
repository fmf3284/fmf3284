'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-gray-900">
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 max-w-md w-full text-center">
            <div className="bg-red-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong!</h1>
            <p className="text-gray-400 mb-6">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => reset()}
                className="w-full px-6 py-3 bg-violet-500 hover:bg-violet-600 text-gray-900 font-semibold rounded-lg transition-all duration-300"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
