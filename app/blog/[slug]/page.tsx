'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string | null;
  authorName: string | null;
  tags: string | null;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Fitness Tips':    'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Nutrition':       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Success Stories': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Workout Guides':  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'News':            'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Simple markdown-like renderer for basic formatting
function renderContent(content: string) {
  return content
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-white mt-10 mb-4">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-white mt-6 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith('- ') || line.startsWith('* ')) return (
        <li key={i} className="text-gray-300 leading-relaxed ml-4 flex items-start gap-2">
          <span className="text-violet-400 mt-1.5 flex-shrink-0">•</span>
          <span>{line.slice(2)}</span>
        </li>
      );
      if (line.startsWith('> ')) return (
        <blockquote key={i} className="border-l-4 border-violet-500 pl-4 my-4 italic text-gray-300">
          {line.slice(2)}
        </blockquote>
      );
      if (line.trim() === '') return <div key={i} className="h-4" />;
      // Bold **text**
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      return <p key={i} className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine }} />;
    });
}

function BlogPostContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data?.post) setPost(data.post); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main style={{ background: '#0f0f1a', minHeight: '100vh' }} className="content-wrapper">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-800 rounded w-1/4" />
            <div className="h-12 bg-gray-700 rounded w-3/4" />
            <div className="h-64 bg-gray-800 rounded-2xl" />
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-800 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />)}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main style={{ background: '#0f0f1a', minHeight: '100vh' }} className="content-wrapper flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <h1 className="text-3xl font-bold text-white mb-3">Post not found</h1>
          <p className="text-gray-400 mb-8">This post may have been removed or the link is incorrect.</p>
          <Link href="/blog" className="px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            ← Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  const catStyle = post.category ? (CATEGORY_COLORS[post.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30') : '';
  const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <main style={{ background: '#0f0f1a', minHeight: '100vh' }} className="content-wrapper">
      {/* Hero */}
      <div className="relative">
        {post.coverImage ? (
          <div className="relative h-72 md:h-96 overflow-hidden">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-black/50 to-transparent" />
          </div>
        ) : (
          <div className="h-32 md:h-48"
            style={{ background: 'linear-gradient(135deg, #1a1035 0%, #0f0f1a 100%)' }} />
        )}
      </div>

      {/* Article */}
      <div className="max-w-3xl mx-auto px-4 pb-20" style={{ marginTop: post.coverImage ? '-60px' : '0' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 relative z-10">
          <Link href="/blog" className="hover:text-violet-400 transition-colors">Blog</Link>
          <span>/</span>
          {post.category && <span className="text-gray-600">{post.category}</span>}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4 relative z-10">
          {post.category && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${catStyle}`}>
              {post.category}
            </span>
          )}
          <span className="text-gray-500 text-sm">{post.viewCount} views</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-6 relative z-10">
          {post.title}
        </h1>

        {/* Author + date */}
        <div className="flex items-center gap-4 pb-6 mb-8 relative z-10"
          style={{ borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            {(post.authorName || 'F')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{post.authorName || 'Find My Fitness'}</p>
            <p className="text-gray-500 text-xs">{formatDate(post.publishedAt)}</p>
          </div>
        </div>

        {/* Content */}
        <article className="prose max-w-none space-y-2">
          {renderContent(post.content)}
        </article>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6" style={{ borderTop: '1px solid rgba(139,92,246,0.2)' }}>
            {tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs text-gray-400"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Back button */}
        <div className="mt-12">
          <Link href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BlogPostPage() {
  return (
    <Suspense fallback={
      <main style={{ background: '#0f0f1a', minHeight: '100vh' }} className="content-wrapper flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <BlogPostContent />
    </Suspense>
  );
}
