import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

// Fallback cities shown when DB has no data yet
const FALLBACK_CITIES = [
  { city: 'Austin',      state: 'TX', icon: '🤠', count: 0 },
  { city: 'Los Angeles', state: 'CA', icon: '🌴', count: 0 },
  { city: 'New York',    state: 'NY', icon: '🗽', count: 0 },
  { city: 'Miami',       state: 'FL', icon: '🏖️', count: 0 },
  { city: 'Chicago',     state: 'IL', icon: '🏙️', count: 0 },
  { city: 'Houston',     state: 'TX', icon: '🚀', count: 0 },
  { city: 'Phoenix',     state: 'AZ', icon: '🌵', count: 0 },
  { city: 'Denver',      state: 'CO', icon: '🏔️', count: 0 },
  { city: 'Seattle',     state: 'WA', icon: '🌧️', count: 0 },
  { city: 'Nashville',   state: 'TN', icon: '🎸', count: 0 },
];

const CITY_ICONS: Record<string, string> = {
  'Austin': '🤠', 'Los Angeles': '🌴', 'New York': '🗽', 'Miami': '🏖️',
  'Chicago': '🏙️', 'Houston': '🚀', 'Phoenix': '🌵', 'Denver': '🏔️',
  'Seattle': '🌧️', 'Nashville': '🎸', 'San Diego': '☀️', 'Dallas': '⭐',
  'San Francisco': '🌁', 'Portland': '🌲', 'Atlanta': '🍑', 'Boston': '🦞',
  'Las Vegas': '🎰', 'Orlando': '🎡', 'Minneapolis': '❄️', 'Detroit': '🚗',
};

export async function GET() {
  try {
    // Group locations by city/state, count them, take top 10
    const cityCounts = await prisma.location.groupBy({
      by: ['city', 'state'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    if (cityCounts.length > 0) {
      const cities = cityCounts.map(c => ({
        city: c.city,
        state: c.state,
        icon: CITY_ICONS[c.city] || '📍',
        count: c._count.id,
      }));
      return NextResponse.json({ cities, source: 'database' });
    }

    // DB is empty — return curated fallback list
    return NextResponse.json({ cities: FALLBACK_CITIES, source: 'fallback' });
  } catch (error) {
    console.error('Top cities error:', error);
    return NextResponse.json({ cities: FALLBACK_CITIES, source: 'fallback' });
  }
}
