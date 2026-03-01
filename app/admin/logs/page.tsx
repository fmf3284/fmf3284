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
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface UserStats {
  id: string;
  name: string | null;
  email: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  loginCount: number;
  createdAt: string;
  _count: {
    activityLogs: number;
  };
}

export default function AdminLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('users');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [activeUsersLast24h, setActiveUsersLast24h] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadLogs();
    }
  }, [timeFilter, filterAction, filterUser]);

  const checkAdminAndLoad = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      
      if (!session.authenticated) {
        router.push('/login');
        return;
      }
      
      if (session.user?.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      await Promise.all([loadLogs(), loadUserStats()]);
    } catch (err) {
      setError('Failed to verify admin access');
      setLoading(false);
    }
  };

  const getTimeFilterParams = () => {
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (timeFilter) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '3d':
        startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customStart) startDate = new Date(customStart);
        break;
      default:
        startDate = null;
    }
    
    return {
      startDate: startDate?.toISOString(),
      endDate: timeFilter === 'custom' && customEnd ? new Date(customEnd).toISOString() : undefined,
    };
  };

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filterAction) params.set('action', filterAction);
      if (filterUser) params.set('userId', filterUser);
      params.set('limit', '200');
      
      const { startDate, endDate } = getTimeFilterParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setActionCounts(data.actionCounts || {});
        setTotalLogs(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/admin/logs', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.users || []);
        setActiveUsersLast24h(data.activeUsersLast24h || 0);
      }
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return '🔑';
      case 'logout': return '🚪';
      case 'search': return '🔍';
      case 'view_location': return '📍';
      case 'write_review': return '✍️';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-green-500/20 text-green-400';
      case 'logout': return 'bg-gray-500/20 text-gray-400';
      case 'search': return 'bg-blue-500/20 text-blue-400';
      case 'view_location': return 'bg-purple-500/20 text-purple-400';
      case 'write_review': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-violet-500 text-xl">Loading activity logs...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Link href="/dashboard" className="text-violet-500 hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-violet-500">📊 Activity Logs</h1>
          <Link href="/admin" className="text-violet-500 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Time Filter */}
        <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-gray-400 text-sm font-medium">Time Period:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '24h', label: '24 Hours' },
                { value: '3d', label: '3 Days' },
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: 'all', label: 'All Time' },
                { value: 'custom', label: 'Custom' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeFilter(option.value)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    timeFilter === option.value
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-2 mt-2 w-full md:w-auto md:mt-0">
                <input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="datetime-local"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <button
                  onClick={loadLogs}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Active (24h)</div>
            <div className="text-2xl font-bold text-green-500">{activeUsersLast24h}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Total Logs</div>
            <div className="text-2xl font-bold text-violet-500">{totalLogs}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Logins</div>
            <div className="text-2xl font-bold text-blue-500">{actionCounts.login || 0}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Searches</div>
            <div className="text-2xl font-bold text-purple-500">{actionCounts.search || 0}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Location Views</div>
            <div className="text-2xl font-bold text-yellow-500">{actionCounts.view_location || 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-violet-500 text-white'
                : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
            }`}
          >
            👥 User Activity
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'logs'
                ? 'bg-violet-500 text-white'
                : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
            }`}
          >
            📋 Activity Log ({logs.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="bg-[#1e1e2d] rounded-xl overflow-hidden border border-violet-900/30">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2a3d]">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Last Login</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Last Active</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Login Count</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Total Actions</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {userStats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No user activity yet
                      </td>
                    </tr>
                  ) : (
                    userStats.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">{user.name || 'No name'}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-white">{formatTimeAgo(user.lastLoginAt)}</div>
                          {user.lastLoginAt && (
                            <div className="text-xs text-gray-500">{formatDate(user.lastLoginAt)}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-white">{formatTimeAgo(user.lastActiveAt)}</div>
                          {user.lastActiveAt && (
                            <div className="text-xs text-gray-500">{formatDate(user.lastActiveAt)}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-lg font-bold text-violet-400">{user.loginCount}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-lg font-bold text-blue-400">{user._count.activityLogs}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setFilterUser(user.id);
                                setActiveTab('logs');
                              }}
                              className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded"
                            >
                              View Logs
                            </button>
                            <Link
                              href={`/admin/profiles/${user.id}`}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                            >
                              View Profile
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 bg-[#1e1e2d] border border-violet-900/30 rounded-lg text-white"
              >
                <option value="">All Actions</option>
                <option value="login">🔑 Login</option>
                <option value="logout">🚪 Logout</option>
                <option value="search">🔍 Search</option>
                <option value="view_location">📍 View Location</option>
                <option value="write_review">✍️ Write Review</option>
              </select>
              {filterUser && (
                <button
                  onClick={() => setFilterUser('')}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Clear User Filter ✕
                </button>
              )}
            </div>

            {/* Logs Table */}
            <div className="bg-[#1e1e2d] rounded-xl overflow-hidden border border-violet-900/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2a2a3d]">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Time</th>
                      <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                      <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Action</th>
                      <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Details</th>
                      <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No activity logs for this period
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const details = parseDetails(log.details);
                        return (
                          <tr key={log.id}>
                            <td className="px-4 py-4">
                              <div className="text-sm text-white">{formatTimeAgo(log.createdAt)}</div>
                              <div className="text-xs text-gray-500">{formatDate(log.createdAt)}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-white">{log.user.name || 'No name'}</div>
                              <div className="text-xs text-gray-400">{log.user.email}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                {getActionIcon(log.action)} {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {details ? (
                                <div className="text-sm text-gray-300">
                                  {details.query && <span>🔍 "{details.query}"</span>}
                                  {details.location && <span>📍 {details.location}</span>}
                                  {details.method && <span>via {details.method}</span>}
                                </div>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-400">
                              {log.ipAddress || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
