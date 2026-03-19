'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  authorName: string | null;
  publishedAt: string | null;
  viewCount: number;
}

const categories = ['All', 'Fitness Tips', 'Nutrition', 'Success Stories', 'Workout Guides', 'News'];

const CATEGORY_COLORS: Record<string, string> = {
  'Fitness Tips':    'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Nutrition':       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Success Stories': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Workout Guides':  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'News':            'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const COVER_GRADIENTS = [
  'from-violet-600 to-purple-800',
  'from-blue-600 to-indigo-800',
  'from-emerald-600 to-teal-800',
  'from-rose-600 to-pink-800',
  'from-amber-600 to-orange-800',
  'from-cyan-600 to-blue-800',
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function readTime(excerpt: string | null) {
  const words = (excerpt || '').split(' ').length;
  return Math.max(1, Math.ceil(words / 200));
}

function PostCard({ post, index, featured = false }: { post: BlogPost; index: number; featured?: boolean }) {
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
  const catStyle = post.category ? (CATEGORY_COLORS[post.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30') : '';

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="relative rounded-2xl overflow-hidden" style={{ height: '420px' }}>
          {/* Background */}
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-3 mb-3">
              {post.category && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${catStyle}`}>
                  {post.category}
                </span>
              )}
              <span className="text-gray-400 text-xs">{readTime(post.excerpt)} min read</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight group-hover:text-violet-300 transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-gray-300 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                  {(post.authorName || 'A')[0].toUpperCase()}
                </div>
                <span className="text-gray-300 text-sm font-medium">{post.authorName || 'Find My Fitness'}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400 text-xs">
                <span>{formatDate(post.publishedAt)}</span>
                <span>{post.viewCount} views</span>
              </div>
            </div>
          </div>
          {/* Featured badge */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
            Featured
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col h-full">
      <div className="rounded-2xl overflow-hidden border transition-all duration-300 h-full flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(139,92,246,0.15)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.border = '1px solid rgba(139,92,246,0.5)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(139,92,246,0.15)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.border = '1px solid rgba(139,92,246,0.15)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Cover */}
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-5xl opacity-30">📖</span>
            </div>
          )}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${catStyle}`}>
                {post.category}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-white font-bold text-base leading-tight mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">{post.excerpt}</p>
          )}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-600/50 flex items-center justify-center text-xs text-white font-bold">
                {(post.authorName || 'A')[0].toUpperCase()}
              </div>
              <span className="text-gray-500 text-xs truncate max-w-[100px]">
                {post.authorName || 'Find My Fitness'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 text-xs">
              <span>{readTime(post.excerpt)} min</span>
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
      <div className="h-48 bg-gray-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-800 rounded w-1/3" />
        <div className="h-5 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => { loadPosts(); }, [selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const param = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}&limit=20` : '?limit=20';
      const res = await fetch(`/api/blog${param}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  };

  const featuredPost = posts[0];
  const restPosts = posts.slice(1);

  return (
    <main className="content-wrapper" style={{ background: '#0f0f1a', minHeight: '100vh' }}>
      {/* Hero */}
      <section className="relative py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1035 50%, #0f0f1a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        </div>
        <div className="max-w-screen-xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            ✍️ Fitness Blog
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            Tips, Guides &
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> Inspiration</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Expert advice to fuel your fitness journey — from workouts to nutrition.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div className="sticky top-0 z-30 border-b" style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(139,92,246,0.15)' }}>
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
                style={{
                  background: selectedCategory === cat ? 'rgba(139,92,246,0.2)' : 'transparent',
                  border: selectedCategory === cat ? '1px solid rgba(139,92,246,0.6)' : '1px solid transparent',
                  color: selectedCategory === cat ? '#a78bfa' : '#9ca3af',
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        {loading ? (
          <div className="space-y-8">
            <div className="h-96 bg-gray-800 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-white mb-2">No posts yet</h3>
            <p className="text-gray-500">Check back soon for fitness tips and guides!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured post */}
            {featuredPost && <PostCard post={featuredPost} index={0} featured />}

            {/* Grid */}
            {restPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restPosts.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
