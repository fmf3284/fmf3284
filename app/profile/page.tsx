'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  age: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  favorite_activities: string[];
  fitness_goals: string;
  experience_level: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<UserProfile>({
    full_name: '',
    email: '',
    phone: '',
    age: 0,
    address: '',
    city: '',
    state: '',
    zip_code: '',
    favorite_activities: [],
    fitness_goals: '',
    experience_level: 'beginner',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiGet('/api/auth/session');

        if (!data.authenticated) {
          router.push('/login');
          return;
        }

        // Mock user profile data (replace with actual API call)
        const mockProfile: UserProfile = {
          full_name: data.user.name,
          email: data.user.email,
          phone: '(555) 123-4567',
          age: 28,
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zip_code: '10001',
          favorite_activities: ['Gym', 'Yoga', 'Running'],
          fitness_goals: 'Build muscle and improve endurance',
          experience_level: 'intermediate',
        };

        setUser(mockProfile);
        setFormData(mockProfile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleActivityToggle = (activity: string) => {
    setFormData({
      ...formData,
      favorite_activities: formData.favorite_activities.includes(activity)
        ? formData.favorite_activities.filter(a => a !== activity)
        : [...formData.favorite_activities, activity],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUser(formData);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData(user);
    }
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <main className="content-wrapper">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-violet-500 text-xl">Loading...</div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </section>

      {/* Profile Content */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
        <div className="max-w-3xl mx-auto px-4">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-900/50 border border-green-700 rounded-lg p-4">
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Profile Information</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-gray-900 font-semibold rounded-lg transition-all duration-300"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-violet-500 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-300 px-4 py-3">{user.full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Email Address</label>
                    <p className="text-gray-300 px-4 py-3">{user.email}</p>
                    {editing && <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Phone Number</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-300 px-4 py-3">{user.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Age</label>
                    {editing ? (
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        min="13"
                        max="120"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-300 px-4 py-3">{user.age} years old</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-violet-500 mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Street Address</label>
                    {editing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-300 px-4 py-3">{user.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">City</label>
                      {editing ? (
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                      ) : (
                        <p className="text-gray-300 px-4 py-3">{user.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">State</label>
                      {editing ? (
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                      ) : (
                        <p className="text-gray-300 px-4 py-3">{user.state}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">ZIP Code</label>
                      {editing ? (
                        <input
                          type="text"
                          name="zip_code"
                          value={formData.zip_code}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                      ) : (
                        <p className="text-gray-300 px-4 py-3">{user.zip_code}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fitness Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-violet-500 mb-4">Fitness Preferences</h3>

                <div className="mb-4">
                  <label className="block text-white font-medium mb-3">Favorite Activities</label>
                  {editing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Gym', 'Yoga', 'Pilates', 'Cross Training', 'Sports Club', 'Personal Trainer', 'Running', 'Swimming', 'Cycling', 'Dance', 'Martial Arts', 'Other'].map((activity) => (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => handleActivityToggle(activity)}
                          className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                            formData.favorite_activities.includes(activity)
                              ? 'bg-violet-500 text-gray-900'
                              : 'bg-gray-900 text-white border border-gray-700 hover:border-violet-500'
                          }`}
                        >
                          {activity}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 px-4 py-3">
                      {user.favorite_activities.map((activity) => (
                        <span
                          key={activity}
                          className="bg-violet-500 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-white font-medium mb-2">Experience Level</label>
                  {editing ? (
                    <select
                      name="experience_level"
                      value={formData.experience_level}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    >
                      <option value="beginner">Beginner - Just starting out</option>
                      <option value="intermediate">Intermediate - Regular exerciser</option>
                      <option value="advanced">Advanced - Experienced athlete</option>
                      <option value="professional">Professional - Competitive level</option>
                    </select>
                  ) : (
                    <p className="text-gray-300 px-4 py-3 capitalize">{user.experience_level}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Fitness Goals</label>
                  {editing ? (
                    <textarea
                      name="fitness_goals"
                      value={formData.fitness_goals}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-vertical"
                    />
                  ) : (
                    <p className="text-gray-300 px-4 py-3">{user.fitness_goals || 'No goals set'}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-lg transition-all duration-300 border border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Quick Links */}
              {!editing && (
                <div className="pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-3 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-white font-medium">Go to Dashboard</span>
                    </Link>
                    <Link
                      href="/locations"
                      className="flex items-center space-x-3 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white font-medium">Browse Locations</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}