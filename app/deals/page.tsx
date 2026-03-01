'use client';

import { useState, useEffect } from 'react';

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
}

const categories = ['All', 'Gym', 'Yoga', 'Pilates', 'Cross Training', 'Sports Club', 'Personal Trainer'];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadDeals();
  }, [selectedCategory]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const response = await fetch(`/api/deals${categoryParam}`);
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

  const featuredDeals = deals.filter(deal => deal.isFeatured);
  const regularDeals = deals.filter(deal => !deal.isFeatured);

  const getDaysRemaining = (dateString: string) => {
    const today = new Date();
    const validUntil = new Date(dateString);
    const diffTime = validUntil.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Exclusive Deals & Offers</h1>
        <p>Save big on memberships, classes, and training sessions</p>
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

      {/* Deals Content */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading deals...</p>
            </div>
          ) : (
            <>
              {/* Featured Deals */}
              {featuredDeals.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <svg className="w-8 h-8 text-violet-500 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Featured Deals
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-gradient-to-br from-violet-500/10 to-gray-800 rounded-lg border-2 border-violet-500 overflow-hidden group relative"
                      >
                        <div className="absolute top-4 right-4 bg-violet-500 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10">
                          FEATURED
                        </div>

                        <div className="p-8">
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-6xl">{deal.image || '🎁'}</div>
                            <div className="bg-violet-500 text-gray-900 px-6 py-3 rounded-lg text-3xl font-bold">
                              {deal.discount}
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="bg-gray-700 text-violet-500 px-3 py-1 rounded-full text-xs font-semibold">
                              {deal.category}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-violet-500 transition-colors">
                            {deal.title}
                          </h3>
                          {deal.locationName && (
                            <p className="text-violet-500 font-semibold mb-3">{deal.locationName}</p>
                          )}
                          <p className="text-gray-300 mb-6">{deal.description}</p>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                            <div className="flex items-center space-x-2">
                              <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-400 text-sm">
                                {getDaysRemaining(deal.validUntil)} days left
                              </span>
                            </div>
                            <span className="text-gray-500 text-sm">
                              Valid until {new Date(deal.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          <button className="w-full mt-6 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                            Claim This Deal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Deals */}
              {regularDeals.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-white mb-8">All Deals</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 hover:border-violet-500 transition-all duration-300 overflow-hidden group"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-5xl">{deal.image || '🎁'}</div>
                            <div className="bg-violet-500 text-gray-900 px-4 py-2 rounded-lg text-xl font-bold">
                              {deal.discount}
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs font-semibold">
                              {deal.category}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-500 transition-colors">
                            {deal.title}
                          </h3>
                          {deal.locationName && (
                            <p className="text-violet-500 font-semibold mb-3 text-sm">{deal.locationName}</p>
                          )}
                          <p className="text-gray-400 text-sm mb-4 line-clamp-3">{deal.description}</p>

                          <div className="flex items-center space-x-2 mb-4 text-sm">
                            <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-400">
                              {getDaysRemaining(deal.validUntil)} days left
                            </span>
                          </div>

                          <button className="w-full bg-gray-700 hover:bg-violet-500 hover:text-gray-900 text-white font-semibold py-3 rounded-lg transition-all duration-300">
                            Claim Deal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {deals.length === 0 && (
                <div className="text-center py-20">
                  <div className="bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎁</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No deals available yet</h3>
                  <p className="text-gray-400 mb-2">Check back soon for exclusive offers{selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}!</p>
                  <p className="text-gray-500 text-sm">We're working with local fitness centers to bring you the best deals.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
