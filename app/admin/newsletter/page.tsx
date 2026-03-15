'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

export default function AdminNewsletterPage() {
  const router = useRouter();
  const toast = useToast();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Broadcast form
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => { checkAdmin(); }, []);
  useEffect(() => { loadSubscribers(); }, [page, search, showAll]);

  const checkAdmin = async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (!data.authenticated || data.user?.role !== 'admin') router.push('/login');
  };

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter?page=${page}&search=${search}&active=${!showAll}`);
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setTotal(data.total || 0);
      setActiveCount(data.activeCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch { toast.error('Failed to load subscribers'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`Remove ${email} from newsletter?`)) return;
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { toast.success('Subscriber removed'); loadSubscribers(); }
      else toast.error('Failed to remove subscriber');
    } catch { toast.error('Failed to remove subscriber'); }
  };

  const handleSend = async (isTest = false) => {
    if (!subject.trim()) { toast.warning('Subject is required'); return; }
    if (!body.trim()) { toast.warning('Email body is required'); return; }
    if (isTest && !testEmail.trim()) { toast.warning('Enter a test email address'); return; }

    if (!isTest && !confirm(`Send newsletter to ALL ${activeCount} active subscribers?\n\nSubject: "${subject}"\n\nThis cannot be undone.`)) return;

    setSending(true);
    try {
      const html = `
        <div style="font-family:-apple-system,sans-serif;background:#0f0f1a;padding:40px 20px;">
          <div style="max-width:560px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:28px 30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🏋️ Find My Fitness</h1>
            </div>
            <div style="padding:32px 30px;">
              ${body.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>`;

      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, text: body, testEmail: isTest ? testEmail : undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        if (!isTest) { setSubject(''); setBody(''); setShowCompose(false); }
      } else {
        toast.error(data.error || 'Failed to send');
      }
    } catch { toast.error('Failed to send newsletter'); }
    finally { setSending(false); }
  };

  const sourceColor: Record<string, string> = {
    footer: 'bg-blue-500/20 text-blue-300',
    register: 'bg-green-500/20 text-green-300',
    admin: 'bg-violet-500/20 text-violet-300',
  };

  return (
    <div className="min-h-screen bg-[#13131a] text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              📧 Newsletter
            </h1>
            <Link href="/admin" className="text-violet-500 hover:underline text-sm">← Back to Dashboard</Link>
          </div>
          <button onClick={() => setShowCompose(!showCompose)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold transition-all">
            ✏️ Compose & Send
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-xl p-4 border border-violet-900/30">
            <p className="text-gray-400 text-sm">Total Subscribers</p>
            <p className="text-2xl font-bold text-violet-400">{total}</p>
          </div>
          <div className="bg-[#1e1e2d] rounded-xl p-4 border border-green-900/30">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          </div>
          <div className="bg-[#1e1e2d] rounded-xl p-4 border border-red-900/30">
            <p className="text-gray-400 text-sm">Unsubscribed</p>
            <p className="text-2xl font-bold text-red-400">{total - activeCount}</p>
          </div>
        </div>

        {/* Compose Panel */}
        {showCompose && (
          <div className="bg-[#1e1e2d] rounded-xl border border-violet-900/30 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">✉️ Compose Newsletter</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subject *</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Your newsletter subject line..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Body * <span className="text-gray-500">(plain text — line breaks become paragraph breaks)</span>
                </label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
                  placeholder={`Hi fitness friends,\n\nWrite your newsletter content here...\n\nStay fit,\nFind My Fitness Team`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:outline-none resize-y font-mono text-sm" />
              </div>

              {/* Preview */}
              {preview && body && (
                <div className="bg-[#0f0f1a] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">Preview</p>
                  <div className="bg-[#1a1a2e] rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap">{body}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-gray-700">
                {/* Test email */}
                <div className="flex gap-2 flex-1 min-w-[280px]">
                  <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                    placeholder="test@email.com"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none" />
                  <button onClick={() => handleSend(true)} disabled={sending}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg disabled:opacity-50 whitespace-nowrap">
                    {sending ? '...' : '📨 Send Test'}
                  </button>
                </div>
                <button onClick={() => setPreview(!preview)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">
                  👁 {preview ? 'Hide' : 'Preview'}
                </button>
                <button onClick={() => handleSend(false)} disabled={sending}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 whitespace-nowrap">
                  {sending ? '📨 Sending...' : `🚀 Send to ${activeCount} Subscribers`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscriber List */}
        <div className="bg-[#1e1e2d] rounded-xl border border-violet-900/30">
          {/* Filters */}
          <div className="flex gap-3 items-center p-4 border-b border-gray-800">
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by email..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="w-4 h-4" />
              Show unsubscribed
            </label>
            <button onClick={loadSubscribers} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">↻ Refresh</button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading subscribers...</div>
          ) : subscribers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-400">No subscribers found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#2a2a3d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Subscribed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subscribers.map(sub => (
                  <tr key={sub.id} className={!sub.isActive ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm text-white">{sub.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{sub.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceColor[sub.source] || 'bg-gray-700 text-gray-300'}`}>
                        {sub.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {sub.isActive ? '✅ Active' : '❌ Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(sub.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {sub.isActive && (
                        <button onClick={() => handleRemove(sub.email)}
                          className="px-2 py-1 bg-red-600/30 hover:bg-red-600 text-red-400 hover:text-white text-xs rounded transition-all">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-800">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 text-sm">← Prev</button>
              <span className="px-4 py-2 text-gray-400 text-sm">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 text-sm">Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
