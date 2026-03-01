'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FitnessLocation {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  rating: number;
  reviewCount: number;
  image: string;
  distance?: string;
  priceRange?: string;
  amenities?: string[];
  placeId?: string;
  memberRating?: number;
  memberReviewCount?: number;
  lat?: number;
  lng?: number;
}

interface FitnessLocationCardProps {
  location: FitnessLocation;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export default function FitnessLocationCard({ location, onSave, isSaved = false }: FitnessLocationCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    setSaved(!saved);
    if (onSave) {
      onSave(location.id);
    }
  };

  // Check if image is a URL or an emoji
  const isImageUrl = location.image && location.image.startsWith('http');
  
  // Fallback emojis based on category
  const categoryEmojis: Record<string, string> = {
    'Gym': '💪',
    'Yoga': '🧘',
    'Pilates': '🤸',
    'Cross Training': '🏋️',
    'Sports Club': '⚽',
    'Personal Trainer': '🎯',
  };
  const fallbackEmoji = categoryEmojis[location.category] || '🏃';

  const renderStars = (rating: number, uniqueId: string) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className="w-5 h-5 text-violet-500 fill-current" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      const gradientId = `half-fill-${uniqueId}`;
      stars.push(
        <svg key="half" className="w-5 h-5 text-violet-500" viewBox="0 0 24 24">
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path fill={`url(#${gradientId})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-600" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div className="bg-[#1e1e2d] rounded-lg border border-violet-900/30 hover:border-violet-500 transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 bg-gray-700 overflow-hidden">
        {isImageUrl && !imageError ? (
          <img
            src={location.image}
            alt={location.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-violet-900/50 to-gray-800">
            {fallbackEmoji}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 p-2 rounded-full transition-all duration-300"
          aria-label={saved ? 'Unsave location' : 'Save location'}
        >
          <svg
            className={`w-6 h-6 ${saved ? 'text-violet-500 fill-current' : 'text-white'}`}
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Category Badge - Color coded */}
        {(() => {
          const categoryStyles: Record<string, string> = {
            'Gym': 'bg-red-500 text-white',
            'Yoga': 'bg-green-500 text-white',
            'Pilates': 'bg-blue-500 text-white',
            'Cross Training': 'bg-orange-500 text-white',
            'Sports Club': 'bg-yellow-500 text-gray-900',
            'Personal Trainer': 'bg-pink-500 text-white',
          };
          const style = categoryStyles[location.category] || 'bg-violet-500 text-gray-900';
          return (
            <div className={`absolute top-4 left-4 ${style} px-3 py-1 rounded-full text-sm font-semibold`}>
              {location.category}
            </div>
          );
        })()}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Name */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-500 transition-colors line-clamp-1">
            {location.name}
          </h3>
        </div>

        {/* Ratings Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Google Rating */}
          {location.rating > 0 && (
            <div className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded text-xs" title="Google Rating">
              <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-yellow-400 font-semibold">{location.rating.toFixed(1)}</span>
              <span className="text-gray-500">({location.reviewCount})</span>
            </div>
          )}
          
          {/* Member Rating */}
          <div 
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
              (location.memberReviewCount || 0) > 0 
                ? 'bg-violet-500/20 border-violet-500/50' 
                : 'bg-violet-500/10 border-violet-500/30'
            }`}
            title="Find My Fitness Member Rating"
          >
            <svg className="w-3 h-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {(location.memberReviewCount || 0) > 0 ? (
              <>
                <svg className="w-3 h-3 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-violet-400 font-semibold">{(location.memberRating || 0).toFixed(1)}</span>
                <span className="text-gray-400">({location.memberReviewCount} members)</span>
              </>
            ) : (
              <span className="text-gray-500">0 members</span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start space-x-2 mb-3">
          <svg className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="text-gray-300 text-sm">{location.address}</p>
            <p className="text-gray-400 text-sm">{location.city}, {location.state}</p>
          </div>
        </div>

        {/* Distance */}
        {location.distance && (
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-gray-300 text-sm">{location.distance} away</span>
          </div>
        )}

        {/* Phone */}
        {location.phone && (
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `tel:${location.phone}`;
              }}
              className="text-gray-300 text-sm hover:text-violet-400 transition-colors cursor-pointer"
            >
              {location.phone}
            </span>
          </div>
        )}

        {/* Amenities */}
        {location.amenities && location.amenities.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">Amenities:</p>
            <div className="flex flex-wrap gap-2">
              {location.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
                >
                  {amenity}
                </span>
              ))}
              {location.amenities.length > 3 && (
                <span className="text-gray-500 text-xs py-1">
                  +{location.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t border-violet-900/30">
          <Link 
            href={`/locations/${location.placeId || location.id}`}
            className="flex-1 bg-violet-500 hover:bg-violet-600 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 text-center"
          >
            View Details
          </Link>
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export type { FitnessLocation };
