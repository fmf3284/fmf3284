'use client';

import dynamic from 'next/dynamic';

const CategoryCarousel = dynamic(() => import('@/components/CategoryCarousel'), {
  loading: () => <div className="categories-section animate-pulse bg-gray-800 h-96" />,
  ssr: false,
});

const MapSection = dynamic(() => import('@/components/MapSection'), {
  loading: () => <div className="map-section animate-pulse bg-gray-800 h-96" />,
  ssr: false,
});

export { CategoryCarousel, MapSection };
