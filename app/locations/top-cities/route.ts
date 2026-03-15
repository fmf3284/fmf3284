'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface City {
  city: string;
  state: string;
  icon: string;
  count: number;
}

// Shown while loading
const SKELETON_COUNT = 6;

export default function LocationsCarousel() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'database' | 'fallback'>('fallback');

  useEffect(() => {
    fetch('/api/locations/top-cities')
      .then(r => r.json())
      .then(data => {
        setCities(data.cities || []);
        setSource(data.source);
      })
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (city: string, state: string) => {
    // Navigate to locations page — the SearchParamsReader will pick up ?city=
    // and set it as the search query, triggering a Google Places search
    router.push(`/locations?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
  };

  return (
    <section className="py-16 bg-[#0f0f1a]">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Popular Locations
            </h2>
            <p className="text-gray-400 mt-1 text-sm">
              {source === 'database'
                ? 'Top cities by number of listed fitness venues'
                : 'Explore fitness options in top US cities'}
            </p>
          </div>
          {source === 'database' && !loading && (
            <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full mb-1">
              Live data
            </span>
          )}
        </div>

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-8">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="w-8 h-8 rounded-lg bg-gray-700 mb-3 mx-auto" />
                <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto mb-2" />
                <div className="h-2 bg-gray-800 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : cities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No cities found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-8">
            {cities.map((loc) => (
              <button
                key={`${loc.city}-${loc.state}`}
                onClick={() => handleClick(loc.city, loc.state)}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer text-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(139,92,246,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(139,92,246,0.2)';
                }}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200 block">
                  {loc.icon}
                </span>
                <span className="text-white text-sm font-bold leading-tight">{loc.city}</span>
                <span className="text-violet-400 text-xs font-medium">{loc.state}</span>
                {loc.count > 0 && (
                  <span className="text-gray-500 text-xs">
                    {loc.count} venue{loc.count !== 1 ? 's' : ''}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/locations')}
            className="px-8 py-3 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 text-sm"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
          >
            Search Your City →
          </button>
        </div>
      </div>
    </section>
  );
}
