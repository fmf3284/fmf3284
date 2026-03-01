'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRemainingAttempts(null);
    setLockedUntil(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle lockout
        if (data.lockedUntil) {
          setLockedUntil(data.lockedUntil);
          setError(data.error);
        } else {
          setError(data.error || 'Login failed');
          if (typeof data.remainingAttempts === 'number') {
            setRemainingAttempts(data.remainingAttempts);
          }
        }
        return;
      }

      // Redirect to dashboard on success
      router.push(data.redirect || '/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle super admin password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          unlockCode: resetCode,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResetError(data.error || 'Password reset failed');
        return;
      }

      setResetSuccess('Password reset successfully! You can now login.');
      setNewPassword('');
      setResetCode('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess('');
        setFormData({ ...formData, email: resetEmail });
      }, 2000);
    } catch (err: any) {
      setResetError('An error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Calculate lockout countdown
  const getLockoutMessage = () => {
    if (!lockedUntil) return null;
    const lockTime = new Date(lockedUntil);
    const now = new Date();
    const diffMs = lockTime.getTime() - now.getTime();
    if (diffMs <= 0) {
      setLockedUntil(null);
      return null;
    }
    const minutes = Math.ceil(diffMs / 1000 / 60);
    return `Account locked. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
  };

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Welcome Back</h1>
        <p>Sign in to access your fitness dashboard</p>
      </section>

      {/* Login Form Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Sign In
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-yellow-300 text-xs mt-2">
                      ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before lockout
                    </p>
                  )}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-900/50 border border-green-700 rounded-lg p-4">
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              )}

              {/* Lockout Warning */}
              {lockedUntil && (
                <div className="bg-orange-900/50 border border-orange-700 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-orange-200 text-sm font-medium">{getLockoutMessage()}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-white font-medium mb-2">
                  Email Address <span className="text-violet-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  disabled={!!lockedUntil}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-white font-medium mb-2">
                  Password <span className="text-violet-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={!!lockedUntil}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              {/* Forgot Password Link - Always visible */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetEmail(formData.email || '');
                    setResetError('');
                    setResetSuccess('');
                  }}
                  className="text-violet-400 hover:text-violet-300 text-sm font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !!lockedUntil}
                className="w-full px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Signing in...' : lockedUntil ? 'Account Locked' : 'Sign In'}
              </button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-400">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-violet-500 hover:text-violet-600 font-semibold">
                    Create one here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-violet-900/30">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Forgot Password</h3>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetError('');
                  setResetSuccess('');
                  setResetCode('');
                  setNewPassword('');
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {resetSuccess && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 mb-4">
                <p className="text-green-200 text-sm">{resetSuccess}</p>
              </div>
            )}

            {resetError && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">{resetError}</p>
              </div>
            )}

            {/* Step 1: Enter Email */}
            {!resetEmail || resetEmail.toLowerCase() !== 'moh.alneama@yahoo.com' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetError('');
                    }}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {resetEmail && resetEmail.toLowerCase() !== 'moh.alneama@yahoo.com' && resetEmail.includes('@') && (
                  <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <p className="text-blue-300 font-medium mb-2">Password Reset Request</p>
                        <p className="text-gray-300 text-sm mb-3">
                          For security reasons, regular users cannot reset their password directly. 
                          Please contact the administrator to request a password reset.
                        </p>
                        <div className="bg-gray-900/50 rounded p-3">
                          <p className="text-gray-400 text-xs mb-1">Contact Support:</p>
                          <p className="text-violet-400 font-medium">support@findmyfitness.fit</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowResetModal(false)}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Step 2: Super Admin - Show Master Code Reset Form */
              <div className="space-y-4">
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <p className="text-yellow-300 text-sm">
                      <strong>Super Admin Detected!</strong> Enter your master code to reset password.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      🔑 Master Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter your secret master code"
                      required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      🔒 New Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={4}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Minimum 4 characters</p>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || !resetCode || !newPassword}
                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? '🔄 Resetting...' : '🔐 Reset Password'}
                  </button>
                </form>

                <button
                  onClick={() => {
                    setResetEmail('');
                    setResetCode('');
                    setNewPassword('');
                    setResetError('');
                  }}
                  className="w-full px-6 py-2 text-gray-400 hover:text-white text-sm transition-all"
                >
                  ← Use different email
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}