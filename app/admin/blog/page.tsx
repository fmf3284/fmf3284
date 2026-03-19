'use client';
import { useToast } from '@/components/Toast';
import RichEditor from '@/components/RichEditor';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  coverImage: string | null;
  authorName: string | null;
  tags: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
}

const SUPER_ADMIN_EMAIL = 'moh.alneama@yahoo.com';

const categories = ['Fitness Tips', 'Nutrition', 'Success Stories', 'Workout Guides', 'News'];

export default function AdminBlogPage() {
  const router = useRouter();
  const toast = useToast();
    const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Fitness Tips',
    coverImage: '',
    authorName: '',
    tags: '',
    isPublished: false,
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
      await loadPosts();
    } catch {
      router.push('/login');
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setForm({
      title: '',
      content: '',
      category: 'Fitness Tips',
      coverImage: '',
      authorName: '',
      tags: '',
      isPublished: false,
    });
    setShowModal(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      content: post.content,
      category: post.category || 'Fitness Tips',
      coverImage: post.coverImage || '',
      authorName: post.authorName || '',
      tags: post.tags || '',
      isPublished: post.isPublished,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      toast.warning('Title and content are required');
      return;
    }

    try {
      const url = editingPost 
        ? `/api/admin/blog/${editingPost.id}`
        : '/api/admin/blog';
      
      const response = await fetch(url, {
        method: editingPost ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setShowModal(false);
        loadPosts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save post');
      }
    } catch {
      toast.error('Failed to save post');
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"?`)) return;

    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadPosts();
      } else {
        toast.error('Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      loadPosts();
    } catch {
      toast.error('Failed to update post');
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
    <div className="min-h-screen bg-[#13131a] text-white p-6 pt-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              ✍️ Blog Management
            </h1>
            <Link href="/admin" className="text-violet-500 hover:underline text-sm">
              ← Back to Dashboard
            </Link>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold transition-all"
          >
            + New Post
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-violet-900/30">
            <div className="text-gray-400 text-sm">Total Posts</div>
            <div className="text-2xl font-bold text-violet-500">{posts.length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-green-900/30">
            <div className="text-gray-400 text-sm">Published</div>
            <div className="text-2xl font-bold text-green-500">{posts.filter(p => p.isPublished).length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-yellow-900/30">
            <div className="text-gray-400 text-sm">Drafts</div>
            <div className="text-2xl font-bold text-yellow-500">{posts.filter(p => !p.isPublished).length}</div>
          </div>
          <div className="bg-[#1e1e2d] rounded-lg p-4 border border-blue-900/30">
            <div className="text-gray-400 text-sm">Total Views</div>
            <div className="text-2xl font-bold text-blue-500">{posts.reduce((sum, p) => sum + p.viewCount, 0)}</div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-[#1e1e2d] rounded-xl overflow-hidden border border-violet-900/30">
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
              <p className="text-gray-400 mb-4">Start sharing fitness tips and stories with your community!</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg"
              >
                Write First Post
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#2a2a3d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Post</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Views</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id} className={!post.isPublished ? 'opacity-70' : ''}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{post.title}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs">{post.category || 'Uncategorized'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.isPublished 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {post.isPublished ? '✅ Published' : '📝 Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {post.viewCount}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePublish(post)}
                          className={`px-2 py-1 text-xs rounded ${
                            post.isPublished 
                              ? 'bg-yellow-600 hover:bg-yellow-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          title={post.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {post.isPublished ? '📝' : '🚀'}
                        </button>
                        <button
                          onClick={() => openEditModal(post)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        {post.isPublished && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-xs rounded inline-block"
                            title="View live"
                          >
                            👁️
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(post)}
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
          <div className="bg-[#1e1e2d] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="How to Start Your Fitness Journey"
                />
              </div>



              <div>
                <label className="block text-sm text-gray-400 mb-2">Content *</label>
                <RichEditor
                  value={form.content}
                  onChange={(html) => setForm({ ...form, content: html })}
                  placeholder="Write your post content here..."
                  minHeight={420}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
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
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="https://unsplash.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g. Find My Fitness Team"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tags <span className="text-gray-500 font-normal">(comma separated)</span></label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="fitness, nutrition, tips"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="published" className="text-sm text-gray-300">🚀 Publish immediately</label>
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
                {editingPost ? 'Update' : 'Create'} Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
