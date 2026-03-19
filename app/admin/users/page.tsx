'use client';
import { useToast } from '@/components/Toast';

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
  emailVerified: boolean;
  deletedAt: string | null;
  daysSinceDeleted?: number;
  daysUntilPermanentDelete?: number;
  canRestore?: boolean;
  createdAt: string;
  _count?: {
    reviews: number;
  };
}

export default function AdminUsers() {
  const router = useRouter();
  const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState<'edit' | 'resetPassword' | 'superAdminReset' | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Super Admin Reset Password State
  const [superAdminResetCode, setSuperAdminResetCode] = useState('');
  const [superAdminNewPassword, setSuperAdminNewPassword] = useState('');
  const [superAdminResetError, setSuperAdminResetError] = useState('');
  const [superAdminResetSuccess, setSuperAdminResetSuccess] = useState('');

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
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
      
      setCurrentUserId(session.user.id);
      setCurrentUserEmail(session.user.email);
      await loadUsers();
    } catch (err) {
      setError('Failed to verify admin access');
      setLoading(false);
    }
  };

  const loadUsers = async (includeDeleted = false) => {
    try {
      setLoading(true);
      const url = includeDeleted 
        ? '/api/admin/users?includeDeleted=true' 
        : '/api/admin/users';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load users');
      }
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Reload when showDeleted changes
  useEffect(() => {
    if (currentUserId) {
      loadUsers(showDeleted);
    }
  }, [showDeleted]);

  const handleRestore = async (user: User) => {
    if (!confirm(`Restore user ${user.name || user.email}?\n\nThis will reactivate their account.`)) return;

    try {
      setUpdating(user.id);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.error(`✅ User ${user.name || user.email} has been restored!`);
        loadUsers(showDeleted);
      } else {
        toast.error(data.error || 'Failed to restore user');
      }
    } catch (err: any) {
      toast.error('Failed to restore user');
    } finally {
      setUpdating(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      toast.error("You cannot change your own role!");
      return;
    }

    // Only Super Admin can promote users to admin
    const isSuperAdmin = currentUserEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (newRole === 'admin' && !isSuperAdmin) {
      toast.error("🔒 Only Super Admin can promote users to Admin role.");
      return;
    }
    
    if (!confirm(`Change this user's role to ${newRole}?`)) return;

    try {
      setUpdating(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (response.ok) {
        await loadUsers(showDeleted);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update role');
      }
    } catch (err: any) {
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleSuspend = async (user: User) => {
    const action = user.status === 'suspended' ? 'activate' : 'suspend';
    const confirmMsg = action === 'suspend' 
      ? `Suspend ${user.name || user.email}? They won't be able to log in.`
      : `Activate ${user.name || user.email}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      setUpdating(user.id);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.error(data.message);
        await loadUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || `Failed to ${action} user`);
      }
    } catch (err: any) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setUpdating(null);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Reset password for ${user.name || user.email}?`)) return;

    try {
      setUpdating(user.id);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetPassword' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTempPassword(data.tempPassword);
        setEditingUser(user);
        setShowModal('resetPassword');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      toast.error('Failed to reset password');
    } finally {
      setUpdating(null);
    }
  };

  const handleResendVerification = async (user: User) => {
    if (!confirm(`Resend verification email to ${user.email}?\n\nThe link will expire in 15 minutes.`)) return;

    try {
      setUpdating(user.id);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resendVerification' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`✅ Verification email sent to ${user.email}!\n\nThe link will expire in 15 minutes.`);
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (err: any) {
      toast.error('Failed to send verification email');
    } finally {
      setUpdating(null);
    }
  };

  const handleOverrideVerification = async (user: User) => {
    if (!confirm(`⚠️ OVERRIDE VERIFICATION for ${user.email}?\n\nThis will mark the user as verified WITHOUT email confirmation.\n\nOnly use this if the user cannot receive emails.`)) return;

    try {
      setUpdating(user.id);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'overrideVerification' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.error(`✅ Verification overridden!\n\n${user.email} is now verified and active.`);
        loadUsers(showDeleted);
      } else {
        toast.error(data.error || 'Failed to override verification');
      }
    } catch (err: any) {
      toast.error('Failed to override verification');
    } finally {
      setUpdating(null);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
    });
    setShowModal('edit');
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;

    try {
      setUpdating(editingUser.id);
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateProfile',
          ...editForm 
        }),
      });
      
      if (response.ok) {
        toast.success('Profile updated successfully');
        setShowModal(null);
        setEditingUser(null);
        await loadUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(null);
    }
  };

  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || '';

  const handleDelete = async (userId: string, userName: string, userEmail: string) => {
    if (userId === currentUserId) {
      toast.error("You cannot delete your own account!");
      return;
    }

    // Check if trying to delete super admin
    if (userEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      toast.success("🔒 PROTECTED: This is the Super Admin account and cannot be deleted.");
      return;
    }
    
    if (!confirm(`DELETE ${userName || 'this user'}? This action cannot be undone!`)) return;

    try {
      setUpdating(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadUsers();
      } else {
        const data = await response.json();
        if (data.protected) {
          toast.error("🔒 PROTECTED: " + data.error);
        } else {
          toast.error(data.error || 'Failed to delete user');
        }
      }
    } catch (err: any) {
      toast.error('Failed to delete user');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-violet-500 text-xl">Loading users...</div>
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
          <h1 className="text-4xl font-bold text-violet-500">👥 Manage Users</h1>
          <Link href="/admin" className="text-violet-500 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#1e1e2d] border border-violet-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              showDeleted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-[#1e1e2d] border border-violet-900/30 text-gray-400 hover:text-white hover:border-red-500'
            }`}
          >
            {showDeleted ? '🗑️ Showing Deleted' : '🗑️ Show Deleted'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Total Users</div>
            <div className="text-2xl font-bold text-violet-500">
              {users.filter(u => !u.deletedAt).length}
            </div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Admins</div>
            <div className="text-2xl font-bold text-violet-500">
              {users.filter(u => u.role === 'admin' && !u.deletedAt).length}
            </div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Active</div>
            <div className="text-2xl font-bold text-green-500">
              {users.filter(u => u.status === 'active' && !u.deletedAt).length}
            </div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Suspended</div>
            <div className="text-2xl font-bold text-red-500">
              {users.filter(u => u.status === 'suspended' && !u.deletedAt).length}
            </div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-red-900/30">
            <div className="text-gray-400 text-sm">🗑️ Deleted</div>
            <div className="text-2xl font-bold text-red-400">
              {users.filter(u => u.deletedAt).length}
            </div>
            <div className="text-xs text-gray-500">90-day retention</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1e1e2d] rounded-xl overflow-hidden border border-violet-900/30">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2a2a3d]">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Reviews</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {search ? 'No users found matching your search' : 'No users yet'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={`${user.id === currentUserId ? 'bg-violet-900/10' : ''} ${user.status === 'suspended' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.status === 'suspended' ? 'bg-red-600' :
                            user.role === 'admin' ? 'bg-violet-600' : 'bg-gray-600'
                          }`}>
                            <span className="text-white font-semibold">
                              {(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white flex items-center gap-2">
                              {user.name || 'No name'}
                              {user.id === currentUserId && (
                                <span className="text-xs text-violet-400">(You)</span>
                              )}
                              {user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-bold">
                                  👑 SUPER ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                            {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {/* Main Status Badge */}
                          {user.deletedAt ? (
                            <div>
                              <span className="px-2 py-1 rounded text-xs font-medium block w-fit bg-red-500/30 text-red-300">
                                🗑️ Deleted
                              </span>
                              {user.daysUntilPermanentDelete !== undefined && (
                                <span className="text-xs text-red-400 block mt-1">
                                  {user.daysUntilPermanentDelete > 0 
                                    ? `⏱️ ${user.daysUntilPermanentDelete} days left`
                                    : '⚠️ Expiring soon'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-medium block w-fit ${
                              user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                              user.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {user.status === 'suspended' ? '🚫 Suspended' : 
                               user.status === 'pending' ? '⏳ Pending' : '✓ Active'}
                            </span>
                          )}
                          {/* Email Verification Badge (only for non-deleted) */}
                          {!user.deletedAt && (
                            <span className={`px-2 py-0.5 rounded text-xs block w-fit ${
                              user.emailVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {user.emailVerified ? '✉️ Verified' : '⚠️ Unverified'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updating === user.id || user.id === currentUserId}
                          className={`bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-violet-500 ${
                            updating === user.id || user.id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="user">👤 User</option>
                          <option 
                            value="admin" 
                            disabled={currentUserEmail?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()}
                          >
                            ⭐ Admin {currentUserEmail?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase() ? '🔒' : ''}
                          </option>
                          <option value="business_owner">🏢 Business</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {user._count?.reviews || 0}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {/* Show actions for other users, OR for Super Admin's own account (Master Reset only) */}
                        {user.id !== currentUserId ? (
                          <div className="flex flex-wrap gap-2">
                            {/* DELETED USER - Show Restore button */}
                            {user.deletedAt ? (
                              <>
                                {user.canRestore && (
                                  <button
                                    onClick={() => handleRestore(user)}
                                    disabled={updating === user.id}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                                    title="Restore User"
                                  >
                                    ♻️ Restore
                                  </button>
                                )}
                                <span className="text-xs text-gray-500 px-2 py-1">
                                  Deleted {user.daysSinceDeleted} days ago
                                </span>
                              </>
                            ) : (
                              <>
                                {/* ACTIVE USER - Normal actions */}
                                <button
                                  onClick={() => openEditModal(user)}
                                  disabled={updating === user.id}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50"
                                  title="Edit Profile"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleSuspend(user)}
                                  disabled={updating === user.id}
                                  className={`px-2 py-1 text-white text-xs rounded disabled:opacity-50 ${
                                    user.status === 'suspended' 
                                      ? 'bg-green-600 hover:bg-green-700' 
                                      : 'bg-yellow-600 hover:bg-yellow-700'
                                  }`}
                                  title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                                >
                                  {user.status === 'suspended' ? '✓ Activate' : '🚫 Suspend'}
                                </button>
                                {/* Resend Verification Email - Only for unverified users */}
                                {!user.emailVerified && (
                                  <button
                                    onClick={() => handleResendVerification(user)}
                                    disabled={updating === user.id}
                                    className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded disabled:opacity-50"
                                    title="Resend Verification Email"
                                  >
                                    📧 Verify
                                  </button>
                                )}
                                {/* Override Verification - Super Admin Only */}
                                {!user.emailVerified && currentUserEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
                                  <button
                                    onClick={() => handleOverrideVerification(user)}
                                    disabled={updating === user.id}
                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded disabled:opacity-50"
                                    title="Override Verification (Super Admin Only)"
                                  >
                                    👑 Override
                                  </button>
                                )}
                                {/* Super Admin gets special reset button */}
                            {user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? (
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setSuperAdminResetCode('');
                                  setSuperAdminNewPassword('');
                                  setSuperAdminResetError('');
                                  setSuperAdminResetSuccess('');
                                  setShowModal('superAdminReset');
                                }}
                                disabled={updating === user.id}
                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded disabled:opacity-50"
                                title="Reset Super Admin Password (Requires Master Code)"
                              >
                                🔐 Master Reset
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResetPassword(user)}
                                disabled={updating === user.id}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded disabled:opacity-50"
                                title="Reset Password"
                              >
                                🔑 Reset PW
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(user.id, user.name || user.email, user.email)}
                              disabled={updating === user.id || user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()}
                              className={`px-2 py-1 text-white text-xs rounded disabled:opacity-50 ${
                                user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
                                  ? 'bg-gray-600 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                              title={user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? '🔒 Protected Super Admin' : 'Delete User'}
                            >
                              {user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? '🔒 Protected' : '🗑️ Delete'}
                            </button>
                              </>
                            )}
                          </div>
                        ) : user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? (
                          /* Super Admin viewing their own account - show Master Reset only */
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setSuperAdminResetCode('');
                                setSuperAdminNewPassword('');
                                setSuperAdminResetError('');
                                setSuperAdminResetSuccess('');
                                setShowModal('superAdminReset');
                              }}
                              disabled={updating === user.id}
                              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded disabled:opacity-50"
                              title="Reset Your Password (Requires Master Code)"
                            >
                              🔐 Master Reset
                            </button>
                            <span className="px-2 py-1 text-gray-500 text-xs">(Your Account)</span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showModal === 'edit' && editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2d] rounded-xl p-6 max-w-lg w-full border border-violet-900/30">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">
                ✏️ Edit Profile: {editingUser.name || editingUser.email}
              </h2>
              <Link
                href={`/admin/profiles/${editingUser.id}`}
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                View Full Profile →
              </Link>
            </div>
            
            {/* User Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-800 rounded p-2 text-center">
                <div className="text-lg font-bold text-violet-400">{editingUser._count?.reviews || 0}</div>
                <div className="text-xs text-gray-500">Reviews</div>
              </div>
              <div className="bg-gray-800 rounded p-2 text-center">
                <div className={`text-lg font-bold ${editingUser.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                  {editingUser.status === 'active' ? '✓' : '✗'}
                </div>
                <div className="text-xs text-gray-500">{editingUser.status}</div>
              </div>
              <div className="bg-gray-800 rounded p-2 text-center">
                <div className={`text-lg font-bold ${editingUser.role === 'admin' ? 'text-violet-400' : 'text-gray-400'}`}>
                  {editingUser.role === 'admin' ? '⭐' : '👤'}
                </div>
                <div className="text-xs text-gray-500">{editingUser.role}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSubmit}
                disabled={updating === editingUser.id}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {updating === editingUser.id ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => { setShowModal(null); setEditingUser(null); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showModal === 'resetPassword' && editingUser && tempPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2d] rounded-xl p-6 max-w-md w-full border border-violet-900/30">
            <h2 className="text-xl font-bold text-white mb-4">
              🔑 Password Reset
            </h2>
            
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm mb-2">
                Password for <strong>{editingUser.name || editingUser.email}</strong> has been reset.
              </p>
              <p className="text-gray-400 text-sm mb-2">New temporary password:</p>
              <div className="bg-gray-800 rounded p-3 font-mono text-xl text-yellow-400 text-center select-all">
                {tempPassword}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                ⚠️ Please share this securely with the user. They should change it immediately after logging in.
              </p>
            </div>

            <button
              onClick={() => { setShowModal(null); setEditingUser(null); setTempPassword(null); }}
              className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Super Admin Master Reset Password Modal */}
      {showModal === 'superAdminReset' && editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2d] rounded-xl p-6 max-w-md w-full border border-yellow-900/50">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🔐 Master Password Reset
              </h2>
              <button
                onClick={() => { 
                  setShowModal(null); 
                  setEditingUser(null);
                  setSuperAdminResetCode('');
                  setSuperAdminNewPassword('');
                  setSuperAdminResetError('');
                  setSuperAdminResetSuccess('');
                }}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👑</span>
                <span className="text-yellow-400 font-bold">SUPER ADMIN ACCOUNT</span>
              </div>
              <p className="text-yellow-300 text-sm">
                This is a protected Super Admin account. Enter the encrypted master code to reset the password.
              </p>
            </div>

            {superAdminResetError && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm">{superAdminResetError}</p>
              </div>
            )}

            {superAdminResetSuccess && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 mb-4">
                <p className="text-green-300 text-sm">{superAdminResetSuccess}</p>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSuperAdminResetError('');
              setSuperAdminResetSuccess('');
              setUpdating(editingUser.id);

              try {
                const response = await fetch('/api/auth/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: editingUser.email,
                    unlockCode: superAdminResetCode,
                    newPassword: superAdminNewPassword,
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  setSuperAdminResetError(data.error || 'Password reset failed');
                } else {
                  setSuperAdminResetSuccess('✅ Password reset successfully! You can now login with the new password.');
                  setSuperAdminResetCode('');
                  setSuperAdminNewPassword('');
                  
                  // Close modal after 3 seconds
                  setTimeout(() => {
                    setShowModal(null);
                    setEditingUser(null);
                    setSuperAdminResetSuccess('');
                  }, 3000);
                }
              } catch (err) {
                setSuperAdminResetError('An error occurred. Please try again.');
              } finally {
                setUpdating(null);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  🔑 Master Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={superAdminResetCode}
                  onChange={(e) => setSuperAdminResetCode(e.target.value)}
                  placeholder="Enter encrypted master code"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <p className="text-gray-500 text-xs mt-1">
                  The master code is required to reset Super Admin password
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  🔒 New Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={superAdminNewPassword}
                  onChange={(e) => setSuperAdminNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Minimum 4 characters for Super Admin
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updating === editingUser.id || !superAdminResetCode || !superAdminNewPassword}
                  className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating === editingUser.id ? '🔄 Resetting...' : '🔐 Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setShowModal(null); 
                    setEditingUser(null);
                    setSuperAdminResetCode('');
                    setSuperAdminNewPassword('');
                    setSuperAdminResetError('');
                  }}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-500 text-xs text-center">
                🔒 This action is logged for security purposes
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
