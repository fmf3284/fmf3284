'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface PlaceDetails {
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    weekday_text?: string[];
    isOpen?: () => boolean;
  };
  photos?: google.maps.places.PlacePhoto[];
  reviews?: google.maps.places.PlaceReview[];
  geometry?: {
    location: google.maps.LatLng;
  };
  types?: string[];
  url?: string;
}

export default function LocationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const placeId = params.id as string;
  
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memberReviews, setMemberReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [category, setCategory] = useState('Gym');

  // Category colors and icons - unified throughout the app
  const categoryConfig: Record<string, { bg: string; text: string; icon: string }> = {
    'Gym': { bg: 'bg-red-500', text: 'text-white', icon: '💪' },
    'Yoga': { bg: 'bg-green-500', text: 'text-white', icon: '🧘' },
    'Pilates': { bg: 'bg-blue-500', text: 'text-white', icon: '🤸' },
    'Cross Training': { bg: 'bg-orange-500', text: 'text-white', icon: '🏋️' },
    'Sports Club': { bg: 'bg-yellow-500', text: 'text-gray-900', icon: '⚽' },
    'Personal Trainer': { bg: 'bg-pink-500', text: 'text-white', icon: '🎯' },
  };

  // Determine category from place name or types
  const determineCategory = (placeName: string, types: string[] = []) => {
    const name = placeName.toLowerCase();
    if (name.includes('yoga') || types.some(t => t.includes('yoga'))) return 'Yoga';
    if (name.includes('pilates') || types.some(t => t.includes('pilates'))) return 'Pilates';
    if (name.includes('crossfit') || name.includes('cross fit') || types.some(t => t.includes('crossfit'))) return 'Cross Training';
    if (name.includes('personal train') || name.includes('trainer')) return 'Personal Trainer';
    if (name.includes('sport') || types.some(t => t.includes('sport'))) return 'Sports Club';
    return 'Gym';
  };

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user) {
          setIsLoggedIn(true);
          setUserName(data.user.name);
          setUserId(data.user.id);
        } else {
          setIsLoggedIn(false);
          setUserName('');
          setUserId('');
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserName('');
        setUserId('');
      }
    };
    
    // Check on mount
    checkAuth();
    
    // Re-check when page becomes visible (after returning from login)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    // Re-check when localStorage changes (multi-tab)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    // Re-check on focus (when user returns to this tab)
    const handleFocus = () => {
      checkAuth();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Load member reviews
  useEffect(() => {
    const loadMemberReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?placeId=${placeId}`);
        if (response.ok) {
          const data = await response.json();
          setMemberReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    if (placeId) {
      loadMemberReviews();
    }
  }, [placeId, reviewSubmitted]);
  
  // Helper to mask name for privacy
  const maskName = (name: string) => {
    if (!name) return 'Anonymous';
    return name.charAt(0).toUpperCase() + '*'.repeat(Math.min(name.length - 1, 6));
  };
  
  // Submit review handler
  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewText.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          placeName: place?.name || 'Unknown Location',
          rating: reviewRating,
          text: reviewText,
          isAnonymous,
        }),
      });
      
      if (response.ok) {
        setReviewSubmitted(true);
        setReviewRating(0);
        setReviewText('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const loadPlaceDetails = async () => {
      // Wait for Google Maps to load
      let attempts = 0;
      while (!window.google?.maps?.places && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      if (!window.google?.maps?.places) {
        setError('Google Maps failed to load');
        setLoading(false);
        return;
      }

      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      service.getDetails(
        {
          placeId: placeId,
          fields: [
            'name',
            'formatted_address',
            'formatted_phone_number',
            'website',
            'rating',
            'user_ratings_total',
            'price_level',
            'opening_hours',
            'photos',
            'reviews',
            'geometry',
            'types',
            'url'
          ]
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            setPlace(result as PlaceDetails);
            setCategory(determineCategory(result.name || '', result.types || []));
            
            // Log location view
            try {
              fetch('/api/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'view_location',
                  details: {
                    placeId,
                    location: result.name,
                  },
                }),
              });
            } catch (e) {
              // Don't block on logging failure
            }
          } else {
            setError('Location not found');
          }
          setLoading(false);
        }
      );
    };

    loadPlaceDetails();
  }, [placeId]);

  const renderStars = (rating: number) => {
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
      stars.push(
        <svg key="half" className="w-5 h-5 text-violet-500" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="half-star-detail">
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path fill="url(#half-star-detail)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

    return <div className="flex">{stars}</div>;
  };

  const getPhotoUrl = (photo: google.maps.places.PlacePhoto, maxWidth: number = 800) => {
    return photo.getUrl({ maxWidth });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 86400) return 'Today';
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
    return `${Math.floor(diff / 31536000)} years ago`;
  };

  if (loading) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a]">
        <div className="max-w-screen-xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-800 rounded-lg mb-8"></div>
            <div className="h-8 bg-gray-800 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="h-48 bg-gray-800 rounded-lg"></div>
                <div className="h-48 bg-gray-800 rounded-lg"></div>
              </div>
              <div className="h-64 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !place) {
    return (
      <main className="content-wrapper min-h-screen bg-[#0f0f1a]">
        <div className="max-w-screen-xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Location Not Found</h1>
          <p className="text-gray-400 mb-8">{error || 'The location you are looking for does not exist.'}</p>
          <Link href="/locations" className="px-6 py-3 bg-violet-500 text-gray-900 font-semibold rounded-lg hover:bg-violet-400 transition-colors">
            Back to Locations
          </Link>
        </div>
      </main>
    );
  }

  const photos = place.photos || [];
  const reviews = place.reviews || [];

  return (
    <main className="content-wrapper min-h-screen bg-[#0f0f1a]">
      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="relative h-[50vh] bg-gray-900 overflow-hidden">
          <img
            src={getPhotoUrl(photos[selectedImageIndex], 1200)}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
          
          {/* Photo Navigation */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex ? 'border-violet-500' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getPhotoUrl(photos[index], 100)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/locations" className="inline-flex items-center text-violet-400 hover:text-violet-300 mb-6 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Locations
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">{place.name}</h1>
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${categoryConfig[category]?.bg || 'bg-gray-500'} ${categoryConfig[category]?.text || 'text-white'}`}>
              <span>{categoryConfig[category]?.icon || '📍'}</span>
              <span className="font-semibold">{category}</span>
            </div>

            {/* Google Rating */}
            {place.rating && (
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(place.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-yellow-400 font-semibold">{place.rating?.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({place.user_ratings_total?.toLocaleString()})</span>
              </div>
            )}
            
            {/* Member Rating - Only show if logged in */}
            {isLoggedIn && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                memberReviews.length > 0 
                  ? 'bg-violet-500/20 border-violet-500/50' 
                  : 'bg-violet-500/10 border-violet-500/30'
              }`}>
                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {memberReviews.length > 0 ? (
                  <>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avgRating = memberReviews.reduce((sum, r) => sum + r.rating, 0) / memberReviews.length;
                        return (
                          <svg key={star} className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-violet-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        );
                      })}
                    </div>
                    <span className="text-violet-400 font-semibold">
                      {(memberReviews.reduce((sum, r) => sum + r.rating, 0) / memberReviews.length).toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">({memberReviews.length} member{memberReviews.length !== 1 ? 's' : ''})</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-400 text-sm">(0 members)</span>
                  </>
                )}
              </div>
            )}

            {place.opening_hours && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                place.opening_hours.isOpen?.() 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {place.opening_hours.isOpen?.() ? 'Open Now' : 'Closed'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hours */}
            {place.opening_hours?.weekday_text && (
              <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hours
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {place.opening_hours.weekday_text.map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-400">{day.split(': ')[0]}</span>
                      <span className="text-white">{day.split(': ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {/* Google Reviews Section */}
            <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Reviews ({reviews.length})
              </h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={index} className="border-b border-violet-900/20 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        {review.profile_photo_url && (
                          <img
                            src={review.profile_photo_url}
                            alt={review.author_name}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-semibold">{review.author_name}</span>
                            <span className="text-gray-500 text-sm">
                              {review.relative_time_description}
                            </span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No Google reviews available</p>
              )}
              
              {place.url && (
                <a
                  href={place.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 border border-gray-600 hover:border-red-500 flex items-center justify-center gap-2"
                >
                  View All Reviews on Google
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            {/* Find My Fitness Member Reviews Section - Only visible to logged in users */}
            {isLoggedIn ? (
              <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Find My Fitness Member Reviews ({memberReviews.length})
                </h2>
                
                {/* Review form or thank you message */}
                {reviewSubmitted ? (
                    <div className="text-center py-8">
                      <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-green-400 font-semibold mb-2">Thank you for your review!</p>
                      <p className="text-gray-500 text-sm">Your review has been submitted.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                          <span className="text-white font-semibold">{userName.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-white font-medium">{userName}</span>
                      </div>
                      
                      {/* Star Rating */}
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Your Rating</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <svg
                                className={`w-8 h-8 ${
                                  star <= (hoverRating || reviewRating) 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-600'
                                } transition-colors`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                          <span className="text-gray-400 text-sm ml-2">
                            {reviewRating > 0 ? `${reviewRating} star${reviewRating > 1 ? 's' : ''}` : 'Select rating'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Review Text */}
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Your Review</label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your experience at this location..."
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                          rows={4}
                        />
                      </div>
                      
                      {/* Privacy Option */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-gray-800"
                          />
                          <span className="ml-2 text-gray-400 text-sm">
                            Post anonymously (show as "{maskName(userName)}")
                          </span>
                        </label>
                      </div>
                      
                      {/* Submit Button */}
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewRating === 0 || !reviewText.trim() || submitting}
                        className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                          reviewRating > 0 && reviewText.trim() && !submitting
                            ? 'bg-violet-500 hover:bg-violet-600 text-gray-900'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  )}
                  
                  {/* Display Member Reviews */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    {loadingReviews ? (
                      <p className="text-gray-500 text-sm text-center">Loading reviews...</p>
                    ) : memberReviews.length > 0 ? (
                      <div className="space-y-4">
                        {memberReviews.map((review) => (
                          <div key={review.id} className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold">
                                  {review.isAnonymous ? '?' : (review.user?.name?.charAt(0) || 'U').toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-semibold">
                                    {review.isAnonymous ? maskName(review.user?.name || 'User') : review.user?.name || 'User'}
                                  </span>
                                  <span className="text-gray-500 text-sm">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <p className="text-gray-300 text-sm">{review.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center">No member reviews yet. Be the first!</p>
                    )}
                  </div>
              </div>
            ) : (
              /* Not logged in - Show login prompt for member reviews */
              <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Find My Fitness Member Reviews
                </h2>
                <div className="text-center py-8">
                  <div className="bg-violet-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-2">Member reviews are exclusive to logged-in users</p>
                  <p className="text-gray-500 text-sm mb-4">Login to see and write member reviews</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-6 py-3 bg-violet-500 hover:bg-violet-600 text-gray-900 font-semibold rounded-lg transition-all duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login to View Member Reviews
                  </Link>
                </div>
              </div>
            )}

            {/* More Photos */}
            {photos.length > 1 && (
              <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photos ({photos.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.slice(0, 9).map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={getPhotoUrl(photo, 300)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-[#1e1e2d] rounded-xl p-6 border border-violet-900/30 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
              
              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-gray-400 text-sm">Address</p>
                    <p className="text-white text-sm">{place.formatted_address}</p>
                  </div>
                </div>

                {/* Phone */}
                {place.formatted_phone_number && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <a href={`tel:${place.formatted_phone_number}`} className="text-white text-sm hover:text-violet-400 transition-colors">
                        {place.formatted_phone_number}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {place.website && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-sm">Website</p>
                      <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-white text-sm hover:text-violet-400 transition-colors truncate block max-w-[200px]">
                        {place.website.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {place.url && (
                  <a
                    href={place.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3 bg-violet-500 hover:bg-violet-400 text-gray-900 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    Get Directions
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </a>
                )}
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all border border-gray-600 hover:border-violet-500 flex items-center justify-center gap-2"
                  >
                    Visit Website
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
