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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const response = await fetch(`/api/blog${categoryParam}`);
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

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Fitness Blog</h1>
        <p>Tips, guides, and inspiration for your fitness journey</p>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-violet-500 text-gray-900'
                    : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No posts yet</h3>
              <p className="text-gray-400">Check back soon for fitness tips, guides, and inspiration!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-violet-500 transition-all group"
                >
                  {/* Cover Image */}
                  <div className="h-48 bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                    {post.coverImage ? (
                      <img 
                        src={post.coverImage} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl opacity-50">📖</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {post.category && (
                      <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-semibold">
                        {post.category}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-white mt-3 mb-2 group-hover:text-violet-400 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-400 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.authorName || 'Admin'}</span>
                      {post.publishedAt && (
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
