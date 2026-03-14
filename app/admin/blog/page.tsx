'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiDelete } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface Location {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export default function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLocations();
  }, [page, search]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/admin/locations?page=${page}&search=${search}`);
      setLocations(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? This will also delete all reviews and bookmarks. This action cannot be undone.')) return;

    try {
      await apiDelete(`/api/admin/locations/${locationId}`);
      loadLocations();
    } catch (err: any) {
      toast.error(err.data?.error || 'Failed to delete location');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-violet-500">Manage Locations</h1>
          <a href="/admin" className="text-violet-500 hover:underline">
            Back to Dashboard
          </a>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search locations by name, city, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Locations Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {locations.map((location) => (
                <tr key={location.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{location.name}</div>
                    <div className="text-xs text-gray-400">ID: {location.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{location.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {location.city}, {location.state}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{location.rating.toFixed(1)} stars</div>
                    <div className="text-xs text-gray-400">{location.reviewCount} reviews</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(location.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <a
                        href={`/locations/${location.id}`}
                        className="text-violet-500 hover:text-violet-400 text-sm"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 text-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
