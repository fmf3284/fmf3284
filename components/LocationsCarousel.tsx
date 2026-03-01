'use client';

import { useState, useEffect } from 'react';

interface Location {
  id: string;
  city: string;
  state: string;
  count: number;
  image: string;
}

const locations: Location[] = [
  { id: '1', city: 'New York', state: 'NY', count: 245, image: '🗽' },
  { id: '2', city: 'Los Angeles', state: 'CA', count: 198, image: '🌴' },
  { id: '3', city: 'Chicago', state: 'IL', count: 156, image: '🏙️' },
  { id: '4', city: 'Houston', state: 'TX', count: 134, image: '🤠' },
  { id: '5', city: 'Phoenix', state: 'AZ', count: 112, image: '🌵' },
  { id: '6', city: 'Miami', state: 'FL', count: 98, image: '🏖️' },
];

export default function LocationsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % locations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isClient]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + locations.length) % locations.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % locations.length);
  };

  if (!isClient) {
    return <div className="locations-section animate-pulse bg-[#1e1e2d] h-96" />;
  }

  return (
    <section className="locations-section py-16 bg-[#0f0f1a]">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Popular Locations
        </h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location, index) => (
                <div
                  key={location.id}
                  className={`bg-[#1e1e2d] rounded-lg p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                    index === currentIndex ? 'ring-2 ring-violet-500' : ''
                  }`}
                >
                  <div className="text-6xl mb-4 text-center">{location.image}</div>
                  <h3 className="text-2xl font-bold text-white text-center mb-1">
                    {location.city}
                  </h3>
                  <p className="text-gray-400 text-center mb-3">{location.state}</p>
                  <p className="text-violet-500 font-semibold text-center">
                    {location.count} fitness centers
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-[#1e1e2d] hover:bg-violet-500 text-white p-3 rounded-full shadow-lg transition-colors duration-300"
            aria-label="Previous location"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-[#1e1e2d] hover:bg-violet-500 text-white p-3 rounded-full shadow-lg transition-colors duration-300"
            aria-label="Next location"
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