'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalReviews: number;
  recentUsers: any[];
  recentReviews: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndLoadDashboard();
  }, []);

  const checkAdminAndLoadDashboard = async () => {
    try {
      // Check if user is admin
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
      
      setIsAdmin(true);
      
      // Load dashboard stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err: any) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a]">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-violet-500 text-xl">Loading dashboard...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a]">
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
    <main className="content-wrapper min-h-screen bg-[#0f0f1a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-violet-500 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" />
          <StatCard title="Total Reviews" value={stats?.totalReviews || 0} icon="⭐" />
          <StatCard title="Pending Reviews" value={0} icon="⏳" />
          <StatCard title="Reports" value={0} icon="🚩" />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <QuickLink 
            href="/admin/users" 
            title="Manage Users" 
            description="View all users, assign admin roles, delete accounts"
            icon="👤"
          />
          <QuickLink 
            href="/admin/reviews" 
            title="Manage Reviews" 
            description="Approve, reject, or delete member reviews"
            icon="📝"
          />
          <QuickLink 
            href="/admin/locations" 
            title="Manage Locations" 
            description="Add or edit fitness locations"
            icon="📍"
          />
          <QuickLink 
            href="/admin/deals" 
            title="Manage Deals" 
            description="Create and manage promotional deals"
            icon="🎁"
          />
          <QuickLink 
            href="/admin/blog" 
            title="Manage Blog" 
            description="Write and publish blog posts"
            icon="✍️"
          />
          <QuickLink 
            href="/admin/logs" 
            title="Activity Logs" 
            description="View login history, searches, and user activity"
            icon="📊"
          />
          <QuickLink 
            href="/admin/emails" 
            title="Email Logs" 
            description="Track sent and failed verification emails"
            icon="📧"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">👥</span> Recent Users
            </h2>
            <div className="space-y-3">
              {stats?.recentUsers?.length ? (
                stats.recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <div>
                      <div className="text-sm font-medium text-white">{user.name || 'No name'}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === 'admin' ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No users yet</p>
              )}
            </div>
            <Link href="/admin/users" className="block mt-4 text-violet-500 hover:underline text-sm">
              View all users →
            </Link>
          </div>

          {/* Recent Reviews */}
          <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">⭐</span> Recent Reviews
            </h2>
            <div className="space-y-3">
              {stats?.recentReviews?.length ? (
                stats.recentReviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-700 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {review.placeName || 'Unknown Location'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        review.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        review.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{review.text}</p>
                    <p className="text-xs text-gray-500 mt-1">by {review.user?.name || 'Anonymous'}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No reviews yet</p>
              )}
            </div>
            <Link href="/admin/reviews" className="block mt-4 text-violet-500 hover:underline text-sm">
              View all reviews →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-violet-500">{value.toLocaleString()}</div>
    </div>
  );
}

function QuickLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
  return (
    <Link
      href={href}
      className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30 hover:border-violet-500 transition-all block"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </Link>
  );
}
