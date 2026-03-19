'use client';
import { useToast } from '@/components/Toast';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Deal {
  id: string;
  title: string;
  description: string;
  discount: string;
  category: string;
  locationName: string | null;
  image: string | null;
  validUntil: string;
  isFeatured: boolean;
  isActive: boolean;
  claimCount: number;
  createdAt: string;
}

const SUPER_ADMIN_EMAIL = 'moh.alneama@yahoo.com';

const categories = ['Gym', 'Yoga', 'Pilates', 'CrossFit', 'Sports Club', 'Personal Trainer', 'Dance', 'Martial Arts', 'Boxing', 'Kickboxing', 'Swimming', 'Cycling', 'Barre', 'Climbing', 'Tennis', 'Pickleball', 'Weightlifting', 'Gymnastics', 'Rowing', 'Running', 'Stretching', 'Sauna & Recovery', 'Wellness', 'Rehabilitation'];
const emojis = ['🎁', '💪', '🧘', '🏋️', '🤸', '⚽', '🎯', '🏃', '🚴', '🥇'];

export default function AdminDealsPage() {
  const router = useRouter();
  const toast = useToast();
    const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    discount: '',
    category: 'Gym',
    locationName: '',
    image: '🎁',
    validUntil: '',
    isFeatured: false,
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (!session.authenticated) { router.push('/login'); return; }
      if (session.user?.role !== 'super_admin') { router.push('/admin'); return; }
      await loadDeals();
    } catch {
      router.push('/login');
    }
  };

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deals');
      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDeal(null);
    setForm({
      title: '',
      description: '',
      discount: '',
      category: 'Gym',
      locationName: '',
      image: '🎁',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isFeatured: false,
    });
    setShowModal(true);
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setForm({
      title: deal.title,
      description: deal.description,
      discount: deal.discount,
      category: deal.category,
      locationName: deal.locationName || '',
      image: deal.image || '🎁',
      validUntil: new Date(deal.validUntil).toISOString().split('T')[0],
      isFeatured: deal.isFeatured,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.discount || !form.validUntil) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      const url = editingDeal 
        ? `/api/admin/deals/${editingDeal.id}`
        : '/api/admin/deals';
      
      const response = await fetch(url, {
        method: editingDeal ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setShowModal(false);
        loadDeals();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save deal');
      }
    } catch {
      toast.error('Failed to save deal');
    }
  };

  const handleDelete = async (deal: Deal) => {
    if (!confirm(`Delete "${deal.title}"?`)) return;

    try {
      const response = await fetch(`/api/admin/deals/${deal.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadDeals();
      } else {
        toast.error('Failed to delete deal');
      }
    } catch {
      toast.error('Failed to delete deal');
    }
  };

  const toggleActive = async (deal: Deal) => {
    try {
      await fetch(`/api/admin/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !deal.isActive }),
      });
      loadDeals();
    } catch {
      toast.error('Failed to update deal');
    }
  };

  const toggleFeatured = async (deal: Deal) => {
    try {
      await fetch(`/api/admin/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !deal.isFeatured }),
      });
      loadDeals();
    } catch {
      toast.error('Failed to update deal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13131a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#13131a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              🎁 Deals Management
            </h1>
            <Link href="/admin" className="text-violet-500 hover:underline text-sm">
              ← Back to Dashboard
            </Link>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold transition-all"
          >
            + New Deal
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Total Deals</div>
            <div className="text-2xl font-bold text-violet-500">{deals.length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-green-900/30">
            <div className="text-gray-400 text-sm">Active</div>
            <div className="text-2xl font-bold text-green-500">{deals.filter(d => d.isActive).length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-yellow-900/30">
            <div className="text-gray-400 text-sm">Featured</div>
            <div className="text-2xl font-bold text-yellow-500">{deals.filter(d => d.isFeatured).length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-blue-900/30">
            <div className="text-gray-400 text-sm">Total Claims</div>
            <div className="text-2xl font-bold text-blue-500">{deals.reduce((sum, d) => sum + d.claimCount, 0)}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-red-900/30">
            <div className="text-gray-400 text-sm">Expired</div>
            <div className="text-2xl font-bold text-red-500">{deals.filter(d => new Date(d.validUntil) < new Date()).length}</div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-[#1e1e2d] rounded-xl overflow-hidden border border-violet-900/30">
          {deals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-white mb-2">No Deals Yet</h3>
              <p className="text-gray-400 mb-4">Create your first deal to attract more customers!</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg"
              >
                Create First Deal
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#2a2a3d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Deal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Valid Until</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {deals.map((deal) => (
                  <tr key={deal.id} className={!deal.isActive ? 'opacity-50' : ''}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{deal.image || '🎁'}</span>
                        <div>
                          <div className="font-medium text-white">{deal.title}</div>
                          {deal.locationName && (
                            <div className="text-xs text-gray-400">{deal.locationName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs">{deal.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded font-bold">
                        {deal.discount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(deal.validUntil).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs w-fit ${
                          deal.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {deal.isActive ? '✅ Active' : '⏸️ Inactive'}
                        </span>
                        {deal.isFeatured && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs w-fit">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(deal)}
                          className={`px-2 py-1 text-xs rounded ${
                            deal.isActive 
                              ? 'bg-gray-600 hover:bg-gray-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {deal.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => toggleFeatured(deal)}
                          className={`px-2 py-1 text-xs rounded ${
                            deal.isFeatured 
                              ? 'bg-yellow-600 hover:bg-yellow-700' 
                              : 'bg-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => openEditModal(deal)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded"
                          title="Edit deal"
                        >
                          ✏️
                        </button>
                        {deal.isActive && (
                          <a
                            href="/deals"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-xs rounded inline-block"
                            title="View on deals page"
                          >
                            👁️
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(deal)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-xs rounded"
                          title="Delete permanently"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2d] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingDeal ? 'Edit Deal' : 'Create New Deal'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., 50% Off First Month"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  rows={3}
                  placeholder="Describe the deal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Discount *</label>
                  <input
                    type="text"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g., 50% OFF, $99, FREE"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Location Name</label>
                <input
                  type="text"
                  value={form.locationName}
                  onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., Elite Fitness Center"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setForm({ ...form, image: emoji })}
                        className={`text-2xl p-2 rounded ${
                          form.image === emoji ? 'bg-violet-600' : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Valid Until *</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="featured" className="text-sm text-gray-300">⭐ Featured Deal</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg"
              >
                {editingDeal ? 'Update' : 'Create'} Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
