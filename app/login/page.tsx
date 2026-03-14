'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'credentials' | '2fa' | 'reset-email' | 'reset-2fa';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [pendingEmail, setPendingEmail] = useState('');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [countdown, setCountdown] = useState(900);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    if (step === '2fa' || step === 'reset-2fa') {
      setCountdown(900);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRemainingAttempts(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.lockedUntil) setLockedUntil(data.lockedUntil);
        setError(data.error || 'Login failed');
        if (typeof data.remainingAttempts === 'number') setRemainingAttempts(data.remainingAttempts);
        return;
      }
      if (data.requires2FA) { setPendingEmail(data.email); setStep('2fa'); }
    } catch { setError('An error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Verification failed'); return; }
      router.push(data.redirect || '/dashboard');
      router.refresh();
    } catch { setOtpError('An error occurred. Please try again.'); }
    finally { setOtpLoading(false); }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setResendSuccess('');
    setOtpError('');
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      setOtp('');
      setResendSuccess('New code sent!');
      setCountdown(900);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { clearInterval(timerRef.current!); return 0; } return prev - 1; });
      }, 1000);
      setTimeout(() => setResendSuccess(''), 3000);
    } catch { setOtpError('Failed to resend. Please try again.'); }
    finally { setResendLoading(false); }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, purpose: 'reset' }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error || 'Something went wrong'); return; }
      setStep('reset-2fa');
    } catch { setResetError('An error occurred. Please try again.'); }
    finally { setResetLoading(false); }
  };

  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const verifyRes = await fetch('/api/auth/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, purpose: 'reset' }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) { setResetError(verifyData.error || 'Invalid code'); return; }

      const resetRes = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const resetData = await resetRes.json();
      if (!resetRes.ok) { setResetError(resetData.error || 'Failed to send reset email'); return; }

      setResetSuccess('Temporary password sent to your email! Check your inbox.');
      setTimeout(() => { setStep('credentials'); setResetEmail(''); setResetOtp(''); setResetSuccess(''); setResetError(''); }, 4000);
    } catch { setResetError('An error occurred. Please try again.'); }
    finally { setResetLoading(false); }
  };

  const getLockoutMessage = () => {
    if (!lockedUntil) return null;
    const diffMs = new Date(lockedUntil).getTime() - Date.now();
    if (diffMs <= 0) { setLockedUntil(null); return null; }
    const minutes = Math.ceil(diffMs / 1000 / 60);
    return `Account locked. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
  };

  return (
    <main className="content-wrapper">
      <section className="splash-screen">
        <h1>Welcome Back</h1>
        <p>Sign in to access your fitness dashboard</p>
      </section>

      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">

            {step === 'credentials' && (
              <>
                <h2 className="text-2xl font-bold text-white text-center mb-8">Sign In</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                      <p className="text-red-200 text-sm">{error}</p>
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <p className="text-yellow-300 text-xs mt-2">Warning: {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before lockout</p>
                      )}
                    </div>
                  )}
                  {lockedUntil && (
                    <div className="bg-orange-900/50 border border-orange-700 rounded-lg p-4">
                      <p className="text-orange-200 text-sm font-medium">Account locked: {getLockoutMessage()}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-white font-medium mb-2">Email Address <span className="text-violet-500">*</span></label>
                    <input type="email" name="email" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com" required autoComplete="email" disabled={!!lockedUntil}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Password <span className="text-violet-500">*</span></label>
                    <input type="password" name="password" value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password" required autoComplete="current-password" disabled={!!lockedUntil}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50" />
                  </div>
                  <div className="text-right">
                    <button type="button"
                      onClick={() => { setStep('reset-email'); setResetEmail(formData.email || ''); setResetError(''); setResetSuccess(''); }}
                      className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading || !!lockedUntil}
                    className="w-full px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {loading ? 'Signing in...' : lockedUntil ? 'Account Locked' : 'Sign In'}
                  </button>
                  <div className="text-center">
                    <p className="text-gray-400">Don't have an account?{' '}
                      <Link href="/register" className="text-violet-500 hover:text-violet-600 font-semibold">Create one here</Link>
                    </p>
                  </div>
                </form>
              </>
            )}

            {step === '2fa' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">📧</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                  <p className="text-gray-400 text-sm">We sent a 6-digit code to</p>
                  <p className="text-violet-400 font-semibold">{pendingEmail}</p>
                </div>
                <form onSubmit={handleVerify2FA} className="space-y-5">
                  {otpError && <div className="bg-red-900/50 border border-red-700 rounded-lg p-3"><p className="text-red-200 text-sm">{otpError}</p></div>}
                  {resendSuccess && <div className="bg-green-900/50 border border-green-700 rounded-lg p-3"><p className="text-green-200 text-sm">{resendSuccess}</p></div>}
                  <div>
                    <label className="block text-white font-medium mb-2 text-center">Verification Code</label>
                    <input type="text" value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                      placeholder="000000" maxLength={6} required autoFocus
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white text-center text-3xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                  <div className="text-center">
                    {countdown > 0
                      ? <p className="text-gray-500 text-sm">Expires in <span className={`font-bold ${countdown <= 15 ? 'text-red-400' : 'text-violet-400'}`}>{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</span></p>
                      : <p className="text-red-400 text-sm font-medium">Code expired</p>}
                  </div>
                  <button type="submit" disabled={otpLoading || otp.length !== 6 || countdown === 0}
                    className="w-full px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleResendOtp} disabled={resendLoading || countdown > 0}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${Math.floor(countdown/60)}m ${countdown%60}s` : 'Resend Code'}
                    </button>
                    <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setOtpError(''); }}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-all">
                      Back
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 'reset-email' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🔐</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                  <p className="text-gray-400 text-sm">We'll verify it's you first by sending a code to your email.</p>
                </div>
                <form onSubmit={handleResetRequest} className="space-y-5">
                  {resetError && <div className="bg-red-900/50 border border-red-700 rounded-lg p-3"><p className="text-red-200 text-sm">{resetError}</p></div>}
                  <div>
                    <label className="block text-white font-medium mb-2">Email Address</label>
                    <input type="email" value={resetEmail}
                      onChange={e => { setResetEmail(e.target.value); setResetError(''); }}
                      placeholder="your@email.com" required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                  <button type="submit" disabled={resetLoading || !resetEmail}
                    className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {resetLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                  <button type="button" onClick={() => { setStep('credentials'); setResetError(''); }}
                    className="w-full px-6 py-2 text-gray-400 hover:text-white text-sm transition-all">
                    Back to Sign In
                  </button>
                </form>
              </>
            )}

            {step === 'reset-2fa' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">📧</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h2>
                  <p className="text-gray-400 text-sm">Enter the code sent to</p>
                  <p className="text-violet-400 font-semibold">{resetEmail}</p>
                </div>
                {resetSuccess ? (
                  <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 text-center">
                    <p className="text-green-200">✅ {resetSuccess}</p>
                    <p className="text-gray-400 text-sm mt-2">Redirecting to login...</p>
                  </div>
                ) : (
                  <form onSubmit={handleResetVerify} className="space-y-5">
                    {resetError && <div className="bg-red-900/50 border border-red-700 rounded-lg p-3"><p className="text-red-200 text-sm">{resetError}</p></div>}
                    <div>
                      <label className="block text-white font-medium mb-2 text-center">Verification Code</label>
                      <input type="text" value={resetOtp}
                        onChange={e => { setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setResetError(''); }}
                        placeholder="000000" maxLength={6} required autoFocus
                        className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white text-center text-3xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                    </div>
                    <div className="text-center">
                      {countdown > 0
                        ? <p className="text-gray-500 text-sm">Expires in <span className={`font-bold ${countdown <= 15 ? 'text-red-400' : 'text-violet-400'}`}>{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</span></p>
                        : <p className="text-red-400 text-sm">Code expired — <button type="button" onClick={() => setStep('reset-email')} className="text-violet-400 underline">request a new one</button></p>}
                    </div>
                    <button type="submit" disabled={resetLoading || resetOtp.length !== 6 || countdown === 0}
                      className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {resetLoading ? 'Verifying...' : 'Verify & Send Temp Password'}
                    </button>
                    <button type="button" onClick={() => { setStep('reset-email'); setResetOtp(''); setResetError(''); }}
                      className="w-full px-6 py-2 text-gray-400 hover:text-white text-sm transition-all">
                      Use different email
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}
