'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Get userId from session
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated || !data.user?.mustChangePassword) {
          router.replace('/dashboard');
        } else {
          setUserId(data.user.id);
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message);
        setTimeout(() => router.replace('/dashboard'), 2000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', padding: '32px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔐</div>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 700 }}>Set New Password</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0 0', fontSize: '14px' }}>
            You must set a new password before continuing
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 30px' }}>
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
            <p style={{ color: '#c4b5fd', fontSize: '14px', margin: 0 }}>
              🔑 You logged in with a temporary password. Please create a new secure password to continue.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>❌ {error}</p>
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ color: '#34d399', fontSize: '14px', margin: 0 }}>✅ {success} Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 500, marginBottom: '8px', fontSize: '14px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  style={{ width: '100%', padding: '12px 48px 12px 16px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} tabIndex={-1} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                  {showNew ? (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 500, marginBottom: '8px', fontSize: '14px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repeat your new password"
                  required
                  minLength={8}
                  style={{ width: '100%', padding: '12px 48px 12px 16px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                  {showConfirm ? (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}
            >
              {loading ? 'Saving...' : 'Set New Password →'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
