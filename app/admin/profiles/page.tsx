'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  status: string;
  loginCount: number;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  _count: {
    reviews: number;
    bookmarks: number;
    activityLogs: number;
  };
}

export default function AdminProfiles() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'lastActive' | 'logins' | 'reviews' | 'created'>('lastActive');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
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

      const response = await fetch('/api/admin/profiles');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load profiles');
      }
    } catch (err) {
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
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

  const filteredUsers = users
    .filter(user => {
      const searchLower = search.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        (user.name?.toLowerCase().includes(searchLower)) ||
        (user.phone?.includes(search))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'lastActive':
          return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime();
        case 'logins':
          return b.loginCount - a.loginCount;
        case 'reviews':
          return b._count.reviews - a._count.reviews;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-violet-500 text-xl">Loading profiles...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Link href="/admin" className="text-violet-500 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-violet-500">📋 All Profiles</h1>
          <Link href="/admin" className="text-violet-500 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[250px] px-4 py-2 bg-[#1e1e2d] border border-violet-900/30 rounded-lg text-white placeholder-gray-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-[#1e1e2d] border border-violet-900/30 rounded-lg text-white"
          >
            <option value="lastActive">Sort by Last Active</option>
            <option value="logins">Sort by Login Count</option>
            <option value="reviews">Sort by Reviews</option>
            <option value="created">Sort by Join Date</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Total Users</div>
            <div className="text-2xl font-bold text-violet-500">{users.length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">With Reviews</div>
            <div className="text-2xl font-bold text-blue-500">{users.filter(u => u._count.reviews > 0).length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Active Today</div>
            <div className="text-2xl font-bold text-green-500">
              {users.filter(u => {
                if (!u.lastActiveAt) return false;
                const diff = Date.now() - new Date(u.lastActiveAt).getTime();
                return diff < 24 * 60 * 60 * 1000;
              }).length}
            </div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Suspended</div>
            <div className="text-2xl font-bold text-red-500">{users.filter(u => u.status === 'suspended').length}</div>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full bg-[#1e1e2d] rounded-xl p-8 text-center border border-violet-900/30">
              <p className="text-gray-500">No profiles found</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/profiles/${user.id}`}
                className={`bg-[#1e1e2d] rounded-xl p-4 border border-violet-900/30 hover:border-violet-500/50 transition-colors ${
                  user.status === 'suspended' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    user.status === 'suspended' ? 'bg-red-600' :
                    user.role === 'admin' ? 'bg-violet-600' : 'bg-gray-600'
                  }`}>
                    {(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium truncate">{user.name || 'No Name'}</h3>
                      {user.role === 'admin' && (
                        <span className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">Admin</span>
                      )}
                      {user.status === 'suspended' && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Suspended</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm truncate">{user.email}</p>
                    {user.phone && <p className="text-gray-500 text-xs">{user.phone}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-[#2a2a3d] rounded p-2">
                    <div className="text-lg font-bold text-violet-400">{user.loginCount}</div>
                    <div className="text-xs text-gray-500">Logins</div>
                  </div>
                  <div className="bg-[#2a2a3d] rounded p-2">
                    <div className="text-lg font-bold text-blue-400">{user._count.reviews}</div>
                    <div className="text-xs text-gray-500">Reviews</div>
                  </div>
                  <div className="bg-[#2a2a3d] rounded p-2">
                    <div className="text-lg font-bold text-yellow-400">{user._count.bookmarks}</div>
                    <div className="text-xs text-gray-500">Bookmarks</div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-between text-xs text-gray-500">
                  <span>Last active: {formatTimeAgo(user.lastActiveAt)}</span>
                  <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
