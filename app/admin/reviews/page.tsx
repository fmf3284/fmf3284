'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface Review {
  id: string;
  placeId: string | null;
  placeName: string | null;
  rating: number;
  text: string | null;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function AdminReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'hidden'>('all');

  useEffect(() => {
    checkAdminAndLoadReviews();
  }, []);

  const checkAdminAndLoadReviews = async () => {
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
      
      await loadReviews();
    } catch (err) {
      setError('Failed to verify admin access');
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        setError('Failed to load reviews');
      }
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      setUpdating(reviewId);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        await loadReviews();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update review');
      }
    } catch (err) {
      toast.error('Failed to update review');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    try {
      setUpdating(reviewId);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadReviews();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete review');
      }
    } catch (err) {
      toast.error('Failed to delete review');
    } finally {
      setUpdating(null);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  if (loading) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a]">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-violet-500 text-xl">Loading reviews...</div>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-violet-500">Manage Reviews</h1>
          <Link href="/admin" className="text-violet-500 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected', 'hidden'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-violet-500 text-white'
                  : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 text-xs">
                ({status === 'all' ? reviews.length : reviews.filter(r => r.status === status).length})
              </span>
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-[#1e1e2d] rounded-xl p-8 text-center border border-violet-900/30">
              <p className="text-gray-500">No reviews found</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {review.placeName || 'Unknown Location'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      by {review.isAnonymous ? 'Anonymous' : (review.user?.name || review.user?.email)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      review.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      review.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      review.status === 'hidden' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                      ★
                    </span>
                  ))}
                  <span className="text-gray-400 text-sm ml-2">{review.rating}/5</span>
                </div>
                
                {/* Review Text */}
                <p className="text-gray-300 mb-4">{review.text || 'No text'}</p>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(review.id, 'approved')}
                      disabled={updating === review.id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                  )}
                  {review.status !== 'rejected' && review.status !== 'hidden' && (
                    <button
                      onClick={() => handleStatusChange(review.id, 'rejected')}
                      disabled={updating === review.id}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  )}
                  {review.status !== 'hidden' && (
                    <button
                      onClick={() => handleStatusChange(review.id, 'hidden')}
                      disabled={updating === review.id}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg disabled:opacity-50"
                    >
                      👁️ Hide
                    </button>
                  )}
                  {review.status === 'hidden' && (
                    <button
                      onClick={() => handleStatusChange(review.id, 'approved')}
                      disabled={updating === review.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50"
                    >
                      👁️ Show
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={updating === review.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
