'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
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
  updatedAt: string;
  // Extended profile fields
  age: number | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  favoriteActivities: string | null;
  experienceLevel: string | null;
  fitnessGoals: string | null;
  // Relations
  reviews: Review[];
  bookmarks: Bookmark[];
  activityLogs: ActivityLog[];
}

interface Review {
  id: string;
  placeId: string;
  placeName: string;
  rating: number;
  text: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
}

interface Bookmark {
  id: string;
  locationId: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminProfileView() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    favoriteActivities: [] as string[],
    experienceLevel: '',
    fitnessGoals: '',
  });

  const activityOptions = ['Gym', 'Yoga', 'Pilates', 'Running', 'Swimming', 'CrossFit', 'HIIT', 'Cycling', 'Dance', 'Martial Arts'];
  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      
      if (!session.authenticated || session.user?.role !== 'admin') {
        router.push('/admin');
        return;
      }

      const response = await fetch(`/api/admin/profiles/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        
        // Parse favorite activities
        let activities: string[] = [];
        if (data.user.favoriteActivities) {
          try {
            activities = JSON.parse(data.user.favoriteActivities);
          } catch {
            activities = [];
          }
        }
        
        setEditForm({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          age: data.user.age?.toString() || '',
          streetAddress: data.user.streetAddress || '',
          city: data.user.city || '',
          state: data.user.state || '',
          zipCode: data.user.zipCode || '',
          favoriteActivities: activities,
          experienceLevel: data.user.experienceLevel || '',
          fitnessGoals: data.user.fitnessGoals || '',
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/profiles/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          age: editForm.age ? parseInt(editForm.age) : null,
          streetAddress: editForm.streetAddress,
          city: editForm.city,
          state: editForm.state,
          zipCode: editForm.zipCode,
          favoriteActivities: JSON.stringify(editForm.favoriteActivities),
          experienceLevel: editForm.experienceLevel,
          fitnessGoals: editForm.fitnessGoals,
        }),
      });
      
      if (response.ok) {
        await loadProfile();
        setIsEditing(false);
      } else {
        alert('Failed to save profile');
      }
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setUpdating(false);
    }
  };

  const toggleActivity = (activity: string) => {
    setEditForm(prev => ({
      ...prev,
      favoriteActivities: prev.favoriteActivities.includes(activity)
        ? prev.favoriteActivities.filter(a => a !== activity)
        : [...prev.favoriteActivities, activity]
    }));
  };

  const handleHideReview = async (reviewId: string) => {
    if (!confirm('Hide this review? It will no longer be visible to users.')) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' }),
      });
      
      if (response.ok) {
        await loadProfile();
      } else {
        alert('Failed to hide review');
      }
    } catch (err) {
      alert('Failed to hide review');
    } finally {
      setUpdating(false);
    }
  };

  const handleShowReview = async (reviewId: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      
      if (response.ok) {
        await loadProfile();
      } else {
        alert('Failed to show review');
      }
    } catch (err) {
      alert('Failed to show review');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('DELETE this review permanently? This cannot be undone.')) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadProfile();
      } else {
        alert('Failed to delete review');
      }
    } catch (err) {
      alert('Failed to delete review');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
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

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  const parseFavoriteActivities = (str: string | null): string[] => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-violet-500 text-xl">Loading profile...</div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-red-400 text-xl mb-4">{error || 'Profile not found'}</div>
          <Link href="/admin/users" className="text-violet-500 hover:underline">
            Back to Users
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="content-wrapper min-h-screen bg-[#0f0f1a] pt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-violet-500">👤 Full Profile View</h1>
          <Link href="/admin/profiles" className="text-violet-500 hover:underline">
            ← Back to Profiles
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                profile.status === 'suspended' ? 'bg-red-600' :
                profile.role === 'admin' ? 'bg-violet-600' : 'bg-gray-600'
              }`}>
                {(profile.name?.charAt(0) || profile.email.charAt(0)).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.name || 'No Name'}</h2>
                <p className="text-gray-400">{profile.email}</p>
                {profile.phone && <p className="text-gray-500 text-sm">{profile.phone}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                profile.role === 'admin' ? 'bg-violet-500/20 text-violet-400' :
                profile.role === 'business_owner' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {profile.role}
              </span>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                profile.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Total Logins</div>
            <div className="text-2xl font-bold text-violet-500">{profile.loginCount}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Reviews</div>
            <div className="text-2xl font-bold text-blue-500">{profile.reviews.length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Bookmarks</div>
            <div className="text-2xl font-bold text-yellow-500">{profile.bookmarks.length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Last Login</div>
            <div className="text-lg font-bold text-green-500">{formatTimeAgo(profile.lastLoginAt)}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Member Since</div>
            <div className="text-lg font-bold text-gray-400">{new Date(profile.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">📋 Profile Information</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isEditing 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-violet-500 hover:bg-violet-600 text-white'
              }`}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            /* Edit Form */
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-violet-400 font-semibold mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Age</label>
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-violet-400 font-semibold mb-3">Address</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Street Address</label>
                    <input
                      type="text"
                      value={editForm.streetAddress}
                      onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">City</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">State</label>
                      <input
                        type="text"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={editForm.zipCode}
                        onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fitness Preferences */}
              <div>
                <h4 className="text-violet-400 font-semibold mb-3">Fitness Preferences</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Favorite Activities</label>
                    <div className="flex flex-wrap gap-2">
                      {activityOptions.map(activity => (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => toggleActivity(activity)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            editForm.favoriteActivities.includes(activity)
                              ? 'bg-violet-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {activity}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Experience Level</label>
                    <select
                      value={editForm.experienceLevel}
                      onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="">Select level...</option>
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Fitness Goals</label>
                    <textarea
                      value={editForm.fitnessGoals}
                      onChange={(e) => setEditForm({ ...editForm, fitnessGoals: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={updating}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-violet-400 font-semibold mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Full Name</div>
                    <div className="text-white">{profile.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Email Address</div>
                    <div className="text-white">{profile.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Phone Number</div>
                    <div className="text-white">{profile.phone || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Age</div>
                    <div className="text-white">{profile.age ? `${profile.age} years old` : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-violet-400 font-semibold mb-3">Address</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <div className="text-gray-400 text-sm">Street Address</div>
                    <div className="text-white">{profile.streetAddress || '—'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">City</div>
                      <div className="text-white">{profile.city || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">State</div>
                      <div className="text-white">{profile.state || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">ZIP Code</div>
                      <div className="text-white">{profile.zipCode || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fitness Preferences */}
              <div>
                <h4 className="text-violet-400 font-semibold mb-3">Fitness Preferences</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Favorite Activities</div>
                    <div className="flex flex-wrap gap-2">
                      {parseFavoriteActivities(profile.favoriteActivities).length > 0 ? (
                        parseFavoriteActivities(profile.favoriteActivities).map(activity => (
                          <span key={activity} className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-sm">
                            {activity}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Experience Level</div>
                    <div className="text-white">{profile.experienceLevel || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Fitness Goals</div>
                    <div className="text-white">{profile.fitnessGoals || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            ⭐ Reviews ({profile.reviews.length})
          </h3>
          
          {profile.reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {profile.reviews.map((review) => (
                <div key={review.id} className={`border border-gray-700 rounded-lg p-4 ${
                  review.status === 'hidden' ? 'opacity-50 bg-red-900/10' : ''
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-white font-medium">{review.placeName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                        <span className="text-gray-500 text-sm">{formatTimeAgo(review.createdAt)}</span>
                        {review.isAnonymous && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Anonymous</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        review.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        review.status === 'hidden' ? 'bg-red-500/20 text-red-400' :
                        review.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{review.text}</p>
                  <div className="flex gap-2">
                    {review.status !== 'hidden' ? (
                      <button
                        onClick={() => handleHideReview(review.id)}
                        disabled={updating}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded disabled:opacity-50"
                      >
                        👁️ Hide
                      </button>
                    ) : (
                      <button
                        onClick={() => handleShowReview(review.id)}
                        disabled={updating}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                      >
                        ✓ Show
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={updating}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📋 Recent Activity (Last 50)
          </h3>
          
          {profile.activityLogs.length === 0 ? (
            <p className="text-gray-500">No activity logged yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2a3d]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {profile.activityLogs.map((log) => {
                    const details = parseDetails(log.details);
                    return (
                      <tr key={log.id}>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white">{formatTimeAgo(log.createdAt)}</div>
                          <div className="text-xs text-gray-500">{formatDate(log.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.action === 'login' ? 'bg-green-500/20 text-green-400' :
                            log.action === 'search' ? 'bg-blue-500/20 text-blue-400' :
                            log.action === 'view_location' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {details?.query && `🔍 "${details.query}"`}
                          {details?.location && `📍 ${details.location}`}
                          {!details?.query && !details?.location && '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {log.ipAddress || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4">
            <Link 
              href={`/admin/logs?userId=${profile.id}`}
              className="text-violet-400 hover:text-violet-300 text-sm"
            >
              View all activity →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
