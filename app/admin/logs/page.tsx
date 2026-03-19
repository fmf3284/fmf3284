'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string };
}

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
  city: string | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  login:                    { label: 'Logged In',            icon: '✅', bg: 'bg-green-500/15',  text: 'text-green-400' },
  login_failed:             { label: 'Failed Login',         icon: '❌', bg: 'bg-red-500/15',    text: 'text-red-400' },
  login_locked:             { label: 'Account Locked',       icon: '🔒', bg: 'bg-red-500/20',    text: 'text-red-500' },
  login_suspicious:         { label: 'Suspicious Login',     icon: '⚠️', bg: 'bg-orange-500/15', text: 'text-orange-400' },
  logout:                   { label: 'Logged Out',           icon: '👋', bg: 'bg-gray-500/15',   text: 'text-gray-400' },
  register:                 { label: 'Registered',           icon: '🎉', bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  email_verified:           { label: 'Email Verified',       icon: '📧', bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  password_reset_requested: { label: 'Password Reset Req',   icon: '🔑', bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  password_changed:         { label: 'Password Changed',     icon: '🔐', bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  password_changed_after_reset: { label: 'Password Reset',   icon: '🔐', bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  '2fa_sent':               { label: '2FA Sent',             icon: '📱', bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  '2fa_failed':             { label: '2FA Failed',           icon: '⚠️', bg: 'bg-orange-500/15', text: 'text-orange-400' },
  profile_updated:          { label: 'Profile Updated',      icon: '✏️', bg: 'bg-violet-500/15', text: 'text-violet-400' },
  account_suspended:        { label: 'Suspended',            icon: '🚫', bg: 'bg-red-500/20',    text: 'text-red-500' },
  account_unsuspended:      { label: 'Restored',             icon: '✅', bg: 'bg-green-500/15',  text: 'text-green-400' },
  account_deleted:          { label: 'Deleted',              icon: '🗑️', bg: 'bg-red-500/20',    text: 'text-red-500' },
  role_changed:             { label: 'Role Changed',         icon: '👑', bg: 'bg-violet-500/15', text: 'text-violet-400' },
  admin_password_reset:     { label: 'Admin PW Reset',       icon: '🔑', bg: 'bg-orange-500/15', text: 'text-orange-400' },
  admin_action:             { label: 'Admin Action',         icon: '⚡', bg: 'bg-violet-500/15', text: 'text-violet-400' },
  user_soft_deleted:        { label: 'User Deleted',         icon: '🗑️', bg: 'bg-red-500/20',    text: 'text-red-500' },
};

const DANGER_ACTIONS = ['login_failed', 'login_locked', 'login_suspicious', 'account_suspended', 'account_deleted', 'user_soft_deleted'];
const FLAG_URL = (code: string) => `https://flagcdn.com/24x18/${code?.toLowerCase()}.png`;

export default function AdminLogsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'activity' | 'visitors' | 'security'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [visitorStats, setVisitorStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState('all');

  useEffect(() => { checkAndLoad(); }, []);
  useEffect(() => { if (!loading) loadAll(); }, [days]);

  const checkAndLoad = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (!session.authenticated || (session.user?.role !== 'admin' && session.user?.role !== 'super_admin')) {
        router.push('/login'); return;
      }
      await loadAll();
    } catch { router.push('/login'); }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [actRes, visRes] = await Promise.all([
        fetch(`/api/admin/logs?limit=300&startDate=${since.toISOString()}`),
        fetch(`/api/admin/visitors?days=${days}&limit=300`),
      ]);

      if (actRes.ok) {
        const data = await actRes.json();
        setActivityLogs(data.logs || []);
      }
      if (visRes.ok) {
        const data = await visRes.json();
        setVisitorLogs(data.logs || []);
        setVisitorStats(data.stats || null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filteredActivity = filter === 'all'
    ? activityLogs
    : filter === 'danger'
    ? activityLogs.filter(l => DANGER_ACTIONS.includes(l.action))
    : activityLogs.filter(l => l.action === filter);

  const securityEvents = activityLogs.filter(l => DANGER_ACTIONS.includes(l.action));

  const totalDevices = visitorStats?.deviceBreakdown?.reduce((s: number, d: any) => s + d._count.device, 0) || 1;

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

  return (
    <div className="min-h-screen bg-[#13131a] text-white">
      {/* Sticky header */}
      <div className="sticky z-20 bg-[#13131a] border-b border-violet-900/30 px-6 py-3 flex flex-wrap justify-between items-center gap-3"
        style={{ top: '112px' }}>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-violet-500 hover:text-violet-300 text-sm">← Admin</Link>
          <h1 className="text-xl font-bold">📊 Logs & Activity</h1>
          {securityEvents.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold animate-pulse">
              ⚠️ {securityEvents.length} security events
            </span>
          )}
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

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'User Actions', value: activityLogs.length, icon: '⚡' },
            { label: 'Logins', value: activityLogs.filter(l => l.action === 'login').length, icon: '✅' },
            { label: 'Failed Logins', value: activityLogs.filter(l => l.action === 'login_failed').length, icon: '❌' },
            { label: 'Security Alerts', value: securityEvents.length, icon: '⚠️' },
            { label: 'Page Views', value: visitorStats?.total || 0, icon: '👁️' },
          ].map(s => (
            <div key={s.label} className="bg-[#1e1e2d] rounded-xl p-4 border border-violet-900/20">
              <div className="text-gray-400 text-xs mb-1">{s.icon} {s.label}</div>
              <div className="text-2xl font-black text-white">{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-violet-900/20">
          {[
            { id: 'activity', label: '⚡ User Activity' },
            { id: 'security', label: `🔒 Security ${securityEvents.length > 0 ? `(${securityEvents.length})` : ''}` },
            { id: 'visitors', label: '👁️ Visitors' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === t.id ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Activity Tab */}
        {tab === 'activity' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {['all', 'login', 'login_failed', 'register', 'password_changed', 'logout', 'role_changed'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filter === f ? 'bg-violet-600 text-white' : 'bg-[#1e1e2d] text-gray-400 hover:text-white border border-violet-900/20'
                  }`}>
                  {f === 'all' ? 'All' : ACTION_META[f]?.label || f}
                </button>
              ))}
            </div>

            <div className="bg-[#1e1e2d] rounded-xl border border-violet-900/20 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#2a2a3d]">
                  <tr>
                    {['Time', 'User', 'Action', 'Location', 'IP', 'Device', 'Details'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredActivity.map(log => {
                    const meta = ACTION_META[log.action] || { label: log.action, icon: '📌', bg: 'bg-gray-500/15', text: 'text-gray-400' };
                    let details: any = {};
                    try { details = JSON.parse(log.details || '{}'); } catch {}
                    const isDanger = DANGER_ACTIONS.includes(log.action);
                    return (
                      <tr key={log.id} className={`transition-colors ${isDanger ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-white/2'}`}>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(log.createdAt).toLocaleDateString()}{' '}
                          <span className="text-gray-600">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white text-xs">{log.user?.name || '—'}</div>
                          <div className="text-gray-500 text-xs truncate max-w-[160px]">{log.user?.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px]">
                          {details.reason && <span>Reason: {details.reason}</span>}
                          {details.attempts && <span className="text-red-400 ml-1">({details.attempts} attempts)</span>}
                          {details.newRole && <span>→ {details.newRole}</span>}
                          {details.method && <span>{details.method}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {log.countryCode && (
                              <img src={`https://flagcdn.com/24x18/${log.countryCode.toLowerCase()}.png`}
                                alt="" className="rounded-sm flex-shrink-0" style={{width:20,height:15}}
                                onError={(e) => {(e.target as HTMLImageElement).style.display='none'}} />
                            )}
                            <span className="text-gray-400 text-xs">{[log.city, log.country].filter(Boolean).join(', ') || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ipAddress || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {log.device && <span>{log.device === 'mobile' ? '📱' : log.device === 'tablet' ? '📋' : '🖥️'} </span>}
                          {log.browser} {log.os ? `· ${log.os}` : ''}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredActivity.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No activity logged yet for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="space-y-4">
            {securityEvents.length === 0 ? (
              <div className="bg-[#1e1e2d] rounded-xl p-12 text-center border border-violet-900/20">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white font-bold">No security events</p>
                <p className="text-gray-500 text-sm">No suspicious activity in the last {days} days.</p>
              </div>
            ) : (
              <div className="bg-[#1e1e2d] rounded-xl border border-red-900/30 overflow-hidden">
                <div className="px-4 py-3 bg-red-500/10 border-b border-red-900/30">
                  <p className="text-red-400 font-semibold text-sm">⚠️ {securityEvents.length} security events detected in the last {days} days</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-[#2a2a3d]">
                    <tr>
                      {['Time', 'User', 'Event', 'IP Address', 'Details'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {securityEvents.map(log => {
                      const meta = ACTION_META[log.action] || { label: log.action, icon: '⚠️', bg: 'bg-red-500/15', text: 'text-red-400' };
                      let details: any = {};
                      try { details = JSON.parse(log.details || '{}'); } catch {}
                      return (
                        <tr key={log.id} className="bg-red-500/5 hover:bg-red-500/10 transition-colors">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {new Date(log.createdAt).toLocaleDateString()}{' '}
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white text-xs">{log.user?.name || '—'}</div>
                            <div className="text-gray-500 text-xs">{log.user?.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>
                              {meta.icon} {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-red-400 font-mono text-xs">{log.ipAddress || '—'}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              {log.countryCode && (
                                <img src={`https://flagcdn.com/24x18/${log.countryCode.toLowerCase()}.png`}
                                  alt="" className="rounded-sm" style={{width:18,height:13}}
                                  onError={(e) => {(e.target as HTMLImageElement).style.display='none'}} />
                              )}
                              <span className="text-xs">{[log.city, log.country].filter(Boolean).join(', ') || ''}</span>
                            </div>
                            {details.attempts && <span className="text-red-400">{details.attempts} attempts · </span>}
                            {details.remainingAttempts !== undefined && <span className="text-orange-400">{details.remainingAttempts} remaining · </span>}
                            {details.reason && <span>{details.reason}</span>}
                            {log.browser && <span className="text-gray-500"> · {log.browser} on {log.os}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Visitors Tab */}
        {tab === 'visitors' && (
          <div className="space-y-6">
            {/* Visitor stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Top Pages */}
              <div className="bg-[#1e1e2d] rounded-xl p-5 border border-violet-900/20">
                <h3 className="font-bold text-white mb-4">📄 Top Pages</h3>
                <div className="space-y-2">
                  {visitorStats?.topPages?.map((p: any) => {
                    const max = visitorStats.topPages[0]?._count.page || 1;
                    const pct = Math.round((p._count.page / max) * 100);
                    return (
                      <div key={p.page}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 truncate max-w-[150px]">{p.page || '/'}</span>
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
                  {visitorStats?.topCountries?.map((c: any) => (
                    <div key={c.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {c.countryCode && (
                          <img src={FLAG_URL(c.countryCode)} alt={c.country} className="rounded-sm"
                            style={{ width: 24, height: 18 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <span className="text-gray-300 text-sm">{c.country}</span>
                      </div>
                      <span className="text-violet-400 font-bold text-sm">{c._count.country}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Devices */}
              <div className="bg-[#1e1e2d] rounded-xl p-5 border border-violet-900/20">
                <h3 className="font-bold text-white mb-4">📱 Devices</h3>
                <div className="space-y-3">
                  {visitorStats?.deviceBreakdown?.map((d: any) => {
                    const pct = Math.round((d._count.device / totalDevices) * 100);
                    const icons: Record<string, string> = { mobile: '📱', tablet: '📋', desktop: '🖥️' };
                    return (
                      <div key={d.device}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{icons[d.device] || '💻'} {d.device}</span>
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

            {/* Visitor table */}
            <div className="bg-[#1e1e2d] rounded-xl border border-violet-900/20 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#2a2a3d]">
                  <tr>
                    {['Time', 'Page', 'Location (City)', 'IP', 'Device', 'Browser', 'User'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {visitorLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleDateString()}{' '}
                        <span className="text-gray-600">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-3 text-violet-400 font-mono text-xs">{log.page}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {log.countryCode && (
                            <img src={FLAG_URL(log.countryCode)} alt="" className="rounded-sm flex-shrink-0"
                              style={{ width: 20, height: 15 }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <span className="text-gray-300 text-xs">{[log.city, log.country].filter(Boolean).join(', ') || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ipAddress || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{log.device}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{log.browser}</td>
                      <td className="px-4 py-3">
                        {log.userId
                          ? <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs">Logged in</span>
                          : <span className="px-2 py-0.5 bg-gray-700 text-gray-500 rounded-full text-xs">Visitor</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {visitorLogs.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No visits tracked yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
