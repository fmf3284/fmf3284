'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: string;
  provider: string;
  messageId: string | null;
  error: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
}

export default function AdminEmails() {
  const router = useRouter();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');

  useEffect(() => {
    checkAdminAndLoadEmails();
  }, [filter]);

  const checkAdminAndLoadEmails = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      
      if (!session.authenticated) {
        router.push('/login');
        return;
      }
      
      if (session.user?.role !== 'admin' && session.user?.role !== 'super_admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      await loadEmails();
    } catch (err) {
      setError('Failed to verify admin access');
      setLoading(false);
    }
  };

  const loadEmails = async () => {
    try {
      setLoading(true);
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const response = await fetch(`/api/admin/emails?limit=100${statusParam}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
        setStats(data.stats || { total: 0, sent: 0, failed: 0 });
      } else {
        setError('Failed to load email logs');
      }
    } catch (err: any) {
      setError('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✅ Sent</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">❌ Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      verification: 'bg-blue-500/20 text-blue-400',
      welcome: 'bg-purple-500/20 text-purple-400',
      password_reset: 'bg-orange-500/20 text-orange-400',
      other: 'bg-gray-500/20 text-gray-400',
    };
    const icons: Record<string, string> = {
      verification: '🔐',
      welcome: '👋',
      password_reset: '🔑',
      other: '📧',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[type] || colors.other}`}>
        {icons[type] || '📧'} {type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13131a] flex items-center justify-center">
        <div className="text-white">Loading email logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#13131a] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#13131a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            📧 Email Logs
          </h1>
          <p className="text-gray-400 mt-2">Track sent and failed emails</p>
          <Link href="/admin" className="text-violet-500 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Total Emails</div>
            <div className="text-2xl font-bold text-violet-500">{stats.total}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-green-900/30">
            <div className="text-gray-400 text-sm">✅ Sent</div>
            <div className="text-2xl font-bold text-green-500">{stats.sent}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-red-900/30">
            <div className="text-gray-400 text-sm">❌ Failed</div>
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all' 
                ? 'bg-violet-600 text-white' 
                : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'sent' 
                ? 'bg-green-600 text-white' 
                : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
            }`}
          >
            ✅ Sent
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'failed' 
                ? 'bg-red-600 text-white' 
                : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
            }`}
          >
            ❌ Failed
          </button>
          <button
            onClick={loadEmails}
            className="px-4 py-2 bg-[#1e1e2d] text-gray-400 hover:text-white rounded-lg ml-auto"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Email List */}
        <div className="bg-[#1e1e2d] rounded-xl overflow-hidden border border-violet-900/30">
          {emails.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-4xl mb-4">📭</p>
              <p>No emails logged yet</p>
              <p className="text-sm mt-2">Emails will appear here when sent</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2a3d]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {emails.map((email) => (
                    <tr key={email.id} className={email.status === 'failed' ? 'bg-red-900/10' : ''}>
                      <td className="px-4 py-3">
                        {getStatusBadge(email.status)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-white">{email.to}</div>
                        {email.messageId && (
                          <div className="text-xs text-gray-500 truncate max-w-[150px]" title={email.messageId}>
                            ID: {email.messageId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getTypeBadge(email.type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-[250px] truncate" title={email.subject}>
                        {email.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {email.provider}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        <div>{new Date(email.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(email.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Error Details for Failed Emails */}
        {emails.some(e => e.status === 'failed' && e.error) && (
          <div className="mt-6 bg-red-900/20 rounded-lg p-4 border border-red-900/30">
            <h3 className="text-red-400 font-medium mb-3">❌ Failed Email Details</h3>
            {emails.filter(e => e.status === 'failed' && e.error).map(email => (
              <div key={email.id} className="mb-2 p-3 bg-[#1e1e2d] rounded">
                <div className="text-sm text-gray-300">{email.to}</div>
                <div className="text-xs text-red-400 mt-1">{email.error}</div>
              </div>
            ))}
          </div>
        )}

        {/* Help */}
        <div className="mt-6 bg-blue-900/20 rounded-lg p-4 border border-blue-900/30">
          <h3 className="text-blue-400 font-medium mb-2">💡 Troubleshooting Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Free tier limitation:</strong> With <code>onboarding@resend.dev</code>, emails can only be sent to YOUR Resend signup email</li>
            <li>• <strong>To send to any email:</strong> Verify your domain at <a href="https://resend.com/domains" target="_blank" className="text-violet-400 underline">resend.com/domains</a></li>
            <li>• <strong>Check Resend dashboard:</strong> <a href="https://resend.com/emails" target="_blank" className="text-violet-400 underline">resend.com/emails</a> for delivery status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
