'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VisitorLog {
  id: string;
  sessionId: string;
  userId: string | null;
  page: string;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  uniqueVisitors: number;
  topPages: { page: string; _count: { page: number } }[];
  topCountries: { country: string; countryCode: string; _count: { country: number } }[];
  deviceBreakdown: { device: string; _count: { device: number } }[];
}

const DEVICE_ICONS: Record<string, string> = { mobile: '📱', tablet: '📋', desktop: '🖥️' };
const FLAG_URL = (code: string) => `https://flagcdn.com/24x18/${code?.toLowerCase()}.png`;

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState<'overview' | 'visitors'>('overview');

  useEffect(() => { checkAndLoad(); }, []);
  useEffect(() => { loadVisitors(); }, [days]);

  const checkAndLoad = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (!session.authenticated || (session.user?.role !== 'admin' && session.user?.role !== 'super_admin')) {
        router.push('/login'); return;
      }
      await loadVisitors();
    } catch { router.push('/login'); }
  };

  const loadVisitors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/visitors?days=${days}&limit=200`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#13131a] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white">
        <svg className="w-5 h-5 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading logs...
      </div>
    </div>
  );

  const totalDevices = stats?.deviceBreakdown.reduce((s, d) => s + d._count.device, 0) || 1;

  return (
    <div className="min-h-screen bg-[#13131a] text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#13131a] border-b border-violet-900/30 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-violet-500 hover:text-violet-300 text-sm">← Admin</Link>
          <h1 className="text-xl font-bold">📊 Visitor Logs</h1>
        </div>
        <div className="flex items-center gap-2">
          {[1, 7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${days === d ? 'bg-violet-600 text-white' : 'bg-[#1e1e2d] text-gray-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Visits', value: stats?.total || 0, icon: '👁️', color: 'violet' },
            { label: 'Unique Visitors', value: stats?.uniqueVisitors || 0, icon: '👤', color: 'blue' },
            { label: 'Countries', value: stats?.topCountries.length || 0, icon: '🌍', color: 'emerald' },
            { label: 'Pages Tracked', value: stats?.topPages.length || 0, icon: '📄', color: 'amber' },
          ].map(card => (
            <div key={card.label} className="bg-[#1e1e2d] rounded-xl p-4 border border-violet-900/20">
              <div className="flex items-center gap-2 mb-1">
                <span>{card.icon}</span>
                <span className="text-gray-400 text-sm">{card.label}</span>
              </div>
              <div className="text-3xl font-black text-white">{card.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-violet-900/20 pb-0">
          {(['overview', 'visitors'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-all -mb-px ${
                tab === t ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t === 'overview' ? '📈 Overview' : '🗒️ All Visits'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Top Pages */}
            <div className="bg-[#1e1e2d] rounded-xl p-5 border border-violet-900/20">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">📄 Top Pages</h3>
              <div className="space-y-2">
                {stats?.topPages.map((p, i) => {
                  const max = stats.topPages[0]?._count.page || 1;
                  const pct = Math.round((p._count.page / max) * 100);
                  return (
                    <div key={p.page}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 truncate max-w-[160px]">{p.page || '/'}</span>
                        <span className="text-violet-400 font-bold ml-2">{p._count.page}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full">
                        <div className="h-1.5 bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-[#1e1e2d] rounded-xl p-5 border border-violet-900/20">
              <h3 className="font-bold text-white mb-4">🌍 Top Countries</h3>
              <div className="space-y-2.5">
                {stats?.topCountries.map(c => (
                  <div key={c.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.countryCode && (
                        <img src={FLAG_URL(c.countryCode)} alt={c.country}
                          className="rounded-sm" style={{ width: 24, height: 18 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <span className="text-gray-300 text-sm">{c.country}</span>
                    </div>
                    <span className="text-violet-400 font-bold text-sm">{c._count.country}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-[#1e1e2d] rounded-xl p-5 border border-violet-900/20">
              <h3 className="font-bold text-white mb-4">📱 Devices</h3>
              <div className="space-y-3">
                {stats?.deviceBreakdown.map(d => {
                  const pct = Math.round((d._count.device / totalDevices) * 100);
                  return (
                    <div key={d.device}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 flex items-center gap-1.5">
                          {DEVICE_ICONS[d.device] || '💻'} {d.device}
                        </span>
                        <span className="text-violet-400 font-bold">{pct}% ({d._count.device})</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full">
                        <div className="h-1.5 bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'visitors' && (
          <div className="bg-[#1e1e2d] rounded-xl border border-violet-900/20 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#2a2a3d]">
                <tr>
                  {['Time', 'Page', 'Location', 'IP', 'Device', 'Browser', 'User'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()}{' '}
                      <span className="text-gray-600">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3 text-violet-400 font-mono text-xs max-w-[150px] truncate">{log.page}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {log.countryCode && (
                          <img src={FLAG_URL(log.countryCode)} alt=""
                            className="rounded-sm flex-shrink-0" style={{ width: 20, height: 15 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <span className="text-gray-300 text-xs">
                          {[log.city, log.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{DEVICE_ICONS[log.device || ''] || '💻'} {log.device}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{log.browser}</td>
                    <td className="px-4 py-3">
                      {log.userId ? (
                        <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs">Logged in</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-500 rounded-full text-xs">Visitor</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No visits tracked yet — deploy and visit a page to start tracking.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
