'use client';

import { useRouter } from 'next/navigation';

const cities = [
  { city: 'Austin',       state: 'TX', icon: '🤠', description: 'Live Music Capital of the World' },
  { city: 'Los Angeles',  state: 'CA', icon: '🌴', description: 'Year-round outdoor fitness' },
  { city: 'New York',     state: 'NY', icon: '🗽', description: 'World-class fitness scene' },
  { city: 'Miami',        state: 'FL', icon: '🏖️', description: 'Beach body ready gyms' },
  { city: 'Chicago',      state: 'IL', icon: '🏙️', description: 'Windy City workouts' },
  { city: 'Houston',      state: 'TX', icon: '🚀', description: 'Space City fitness hubs' },
  { city: 'Phoenix',      state: 'AZ', icon: '🌵', description: 'Desert strength training' },
  { city: 'Denver',       state: 'CO', icon: '🏔️', description: 'Mile High fitness' },
  { city: 'Seattle',      state: 'WA', icon: '🌧️', description: 'Pacific Northwest gyms' },
  { city: 'Nashville',    state: 'TN', icon: '🎸', description: 'Music City fitness' },
  { city: 'San Diego',    state: 'CA', icon: '☀️', description: 'Beach and outdoor fitness' },
  { city: 'Dallas',       state: 'TX', icon: '⭐', description: 'Big D fitness centers' },
];

export default function LocationsCarousel() {
  const router = useRouter();

  const handleClick = (city: string, state: string) => {
    router.push(`/locations?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
  };

  return (
    <section className="py-16 bg-[#0f0f1a]">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          Popular Locations
        </h2>
        <p className="text-gray-400 text-center mb-10">
          Explore fitness options in top cities across the US
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {cities.map((loc) => (
            <button
              key={`${loc.city}-${loc.state}`}
              onClick={() => handleClick(loc.city, loc.state)}
              className="group flex flex-col items-center gap-2 p-4 bg-[#1e1e2d] rounded-xl border border-violet-900/30 hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer text-center"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {loc.icon}
              </span>
              <span className="text-white text-sm font-bold leading-tight">{loc.city}</span>
              <span className="text-violet-400 text-xs font-medium">{loc.state}</span>
              <span className="text-gray-500 text-xs leading-tight hidden sm:block">{loc.description}</span>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/locations')}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
          >
            Search Your City →
          </button>
        </div>
      </div>
    </section>
  );
}
