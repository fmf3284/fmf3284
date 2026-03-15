'use client';

import { useRouter } from 'next/navigation';

const categories = [
  { name: 'Gym',              icon: '💪', description: 'Full-service fitness centers' },
  { name: 'Yoga',             icon: '🧘', description: 'Mind and body wellness' },
  { name: 'Pilates',          icon: '🤸', description: 'Core strength and flexibility' },
  { name: 'CrossFit',         icon: '🏋️', description: 'High-intensity functional training' },
  { name: 'Personal Trainer', icon: '🎯', description: 'One-on-one coaching' },
  { name: 'Dance',            icon: '💃', description: 'Dance fitness and studios' },
  { name: 'Martial Arts',     icon: '🥋', description: 'Self-defense and discipline' },
  { name: 'Boxing',           icon: '🥊', description: 'Boxing and combat sports' },
  { name: 'Kickboxing',       icon: '🦵', description: 'Cardio kickboxing classes' },
  { name: 'Swimming',         icon: '🏊', description: 'Pools and aquatic centers' },
  { name: 'Cycling',          icon: '🚴', description: 'Indoor cycling and spin' },
  { name: 'Barre',            icon: '🩰', description: 'Ballet-inspired fitness' },
  { name: 'Climbing',         icon: '🧗', description: 'Rock climbing gyms' },
  { name: 'Tennis',           icon: '🎾', description: 'Tennis and racquet sports' },
  { name: 'Pickleball',       icon: '🏓', description: 'The fastest growing sport' },
  { name: 'Weightlifting',    icon: '🏋️', description: 'Powerlifting and strength' },
  { name: 'Gymnastics',       icon: '🤼', description: 'Gymnastics academies' },
  { name: 'Rowing',           icon: '🚣', description: 'Indoor rowing studios' },
  { name: 'Running',          icon: '🏃', description: 'Running clubs and tracks' },
  { name: 'Stretching',       icon: '🙆', description: 'Mobility and flexibility' },
  { name: 'Sauna & Recovery', icon: '🧖', description: 'Recovery and wellness' },
  { name: 'Sports Club',      icon: '⚽', description: 'Multi-sport facilities' },
  { name: 'Wellness',         icon: '🌿', description: 'Holistic health centers' },
  { name: 'Rehabilitation',   icon: '🩺', description: 'Physical therapy and rehab' },
];

export default function CategoryCarousel() {
  const router = useRouter();

  const handleClick = (categoryName: string) => {
    router.push(`/locations?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e]">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          Browse by Category
        </h2>
        <p className="text-gray-400 text-center mb-10">
          Find exactly the type of fitness you&apos;re looking for
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleClick(cat.name)}
              className="group flex flex-col items-center gap-2 p-4 bg-[#1e1e2d] rounded-xl border border-violet-900/30 hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer text-center"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {cat.icon}
              </span>
              <span className="text-white text-sm font-semibold leading-tight">{cat.name}</span>
              <span className="text-gray-500 text-xs leading-tight hidden sm:block">{cat.description}</span>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/locations')}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
          >
            View All Locations →
          </button>
        </div>
      </div>
    </section>
  );
}
