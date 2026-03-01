'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const categories: Category[] = [
  { id: '1', name: 'Gyms', icon: '🏋️', description: 'Full-service fitness centers' },
  { id: '2', name: 'Yoga Studios', icon: '🧘', description: 'Mind and body wellness' },
  { id: '3', name: 'Personal Trainers', icon: '💪', description: 'One-on-one coaching' },
  { id: '4', name: 'Pilates', icon: '🤸', description: 'Core strength and flexibility' },
  { id: '5', name: 'CrossFit', icon: '⚡', description: 'High-intensity workouts' },
  { id: '6', name: 'Martial Arts', icon: '🥋', description: 'Self-defense and discipline' },
];

export default function CategoryCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % categories.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isClient]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + categories.length) % categories.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % categories.length);
  };

  if (!isClient) {
    return <div className="categories-section animate-pulse bg-[#1e1e2d] h-96" />;
  }

  return (
    <section className="categories-section py-16 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Browse by Category
        </h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={`bg-[#1e1e2d] rounded-lg p-6 border border-violet-900/30 hover:border-violet-500 transition-all duration-300 transform hover:scale-105 ${
                    index === currentIndex ? 'ring-2 ring-violet-500' : ''
                  }`}
                >
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{category.name}</h3>
                  <p className="text-gray-400">{category.description}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-[#1e1e2d] hover:bg-violet-500 text-white p-3 rounded-full shadow-lg transition-colors duration-300"
            aria-label="Previous category"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-[#1e1e2d] hover:bg-violet-500 text-white p-3 rounded-full shadow-lg transition-colors duration-300"
            aria-label="Next category"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}