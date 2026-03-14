'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import FitnessLocationCard, { FitnessLocation } from '@/components/FitnessLocationCard';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import GoogleMap from '@/components/GoogleMap';

const mockLocations: FitnessLocation[] = [
  {
    id: '1',
    name: 'Elite Fitness Center',
    category: 'Gym',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    phone: '(212) 555-0123',
    rating: 4.5,
    reviewCount: 243,
    image: '💪',
    distance: '0.8 miles',
    priceRange: '$$',
    amenities: ['Pool', 'Sauna', 'Personal Training', 'Group Classes', 'Parking'],
  },
  {
    id: '2',
    name: 'Zen Yoga Studio',
    category: 'Yoga',
    address: '456 Park Avenue',
    city: 'New York',
    state: 'NY',
    phone: '(212) 555-0456',
    rating: 4.8,
    reviewCount: 187,
    image: '🧘',
    distance: '1.2 miles',
    priceRange: '$',
    amenities: ['Mat Rental', 'Showers', 'Meditation Room', 'Tea Bar'],
  },
  {
    id: '3',
    name: 'PowerCore Pilates',
    category: 'Pilates',
    address: '789 Broadway',
    city: 'New York',
    state: 'NY',
    phone: '(212) 555-0789',
    rating: 4.6,
    reviewCount: 156,
    image: '🤸',
    distance: '1.5 miles',
    priceRange: '$$',
    amenities: ['Reformer Classes', 'Mat Classes', 'Private Sessions', 'Showers'],
  },
  {
    id: '4',
    name: 'CrossFit Downtown',
    category: 'Cross Training',
    address: '321 Fifth Avenue',
    city: 'New York',
    state: 'NY',
    phone: '(212) 555-0321',
    rating: 4.7,
    reviewCount: 298,
    image: '🏋️',
    distance: '2.1 miles',
    priceRange: '$$$',
    amenities: ['Olympic Lifting', 'Personal Training', 'Nutrition Coaching', 'Open Gym'],
  },
  {
    id: '5',
    name: 'NYC Sports Complex',
    category: 'Sports Club',
    address: '654 West Street',
    city: 'New York',
    state: 'NY',
    phone: '(212) 555-0654',
    rating: 4.4,
    reviewCount: 421,
    image: '⚽',
    distance: '2.8 miles',
    priceRange: '$$',
    amenities: ['Basketball Courts', 'Tennis', 'Swimming Pool', 'Racquetball', 'Cafe'],
  },
  {
    id: '6',
    name: 'Premium Personal Training',
    category: 'Personal Trainer',
    address: '987 Madison Avenue',
    city: 'New York',
    state: 'NY',
    phone: '(212) 555-0987',
    rating: 4.9,
    reviewCount: 89,
    image: '🎯',
    distance: '1.0 miles',
    priceRange: '$$$',
    amenities: ['1-on-1 Training', 'Custom Programs', 'Nutrition Plans', 'Virtual Sessions'],
  },
];

// Extract all unique amenities from locations
const allAmenities = Array.from(
  new Set(mockLocations.flatMap((loc) => loc.amenities || []))
).sort();

const categories = [
  'All', 'Gym', 'Yoga', 'Pilates', 'CrossFit', 'Sports Club', 'Personal Trainer',
  'Dance', 'Martial Arts', 'Boxing', 'Swimming', 'Cycling', 'Barre',
  'Climbing', 'Tennis', 'Wellness', 'Rehabilitation',
];
const sortOptions = [
  'Rating (High-Low)',
  'Most Reviewed',
  'Name (A-Z)',
  'Name (Z-A)',
];
const distanceOptions = ['All', 'Under 1 mile', '1-2 miles', '2-3 miles', '3+ miles'];

export default function LocationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Name (A-Z)');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  // Real places from Google
  const [realPlaces, setRealPlaces] = useState<FitnessLocation[]>([]);
  const [isSearching, setIsSearching] = useState(true); // Start with true - searching on load
  const [searchedAddress, setSearchedAddress] = useState('');
  const [searchRadius, setSearchRadius] = useState(10); // miles

  // Map state
  const [showMap, setShowMap] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<FitnessLocation | null>(null);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState('All');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Store current location for re-search
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (dir: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const handleSave = (id: string) => {
    setSavedLocations((prev) => (prev.includes(id) ? prev.filter((locId) => locId !== id) : [...prev, id]));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSelectedDistance('All');
    setSelectedAmenities([]);
    setSelectedCategory('All');
    setSearchQuery('');
  };

  
  // Convert Google Place to FitnessLocation format
  const convertGooglePlace = (
    place: google.maps.places.PlaceResult, 
    index: number, 
    phone?: string, 
    fetchedPriceLevel?: number | null,
    fetchedRating?: number | null,
    fetchedReviewCount?: number | null
  ): FitnessLocation => {
    const types = place.types || [];
    const name = place.name?.toLowerCase() || '';
    let category = 'Gym';
    // Type-based detection first
    if (types.some(t => t.includes('yoga'))) category = 'Yoga';
    else if (types.some(t => t.includes('pilates'))) category = 'Pilates';
    else if (types.some(t => t.includes('crossfit'))) category = 'CrossFit';
    else if (types.some(t => t.includes('sport'))) category = 'Sports Club';
    else if (types.some(t => t.includes('swim') || t.includes('aquatic'))) category = 'Swimming';
    else if (types.some(t => t.includes('tennis') || t.includes('racquet'))) category = 'Tennis';
    // Name-based detection
    else if (name.includes('yoga') || name.includes('namaste') || name.includes('bikram') || name.includes('hot yoga')) category = 'Yoga';
    else if (name.includes('pilates') || name.includes('reformer')) category = 'Pilates';
    else if (name.includes('crossfit') || name.includes('cross fit')) category = 'CrossFit';
    else if (name.includes('personal train') || name.includes('private train') || name.includes('1-on-1') || name.includes('one on one')) category = 'Personal Trainer';
    else if (name.includes('dance') || name.includes('ballet') || name.includes('salsa') || name.includes('zumba') || name.includes('hip hop')) category = 'Dance';
    else if (name.includes('martial art') || name.includes('karate') || name.includes('judo') || name.includes('taekwondo') || name.includes('jiu jitsu') || name.includes('bjj') || name.includes('kung fu')) category = 'Martial Arts';
    else if (name.includes('boxing') || name.includes('mma') || name.includes('kickbox') || name.includes('muay thai') || name.includes('title box')) category = 'Boxing';
    else if (name.includes('swim') || name.includes('aquatic') || name.includes('pool') || name.includes('natatorium')) category = 'Swimming';
    else if (name.includes('cycl') || name.includes('spin') || name.includes('soulcycle') || name.includes('cyclebar') || name.includes('peloton')) category = 'Cycling';
    else if (name.includes('barre') || name.includes('pure barre') || name.includes('barre3')) category = 'Barre';
    else if (name.includes('climb') || name.includes('boulder') || name.includes('rock gym') || name.includes('vertical') || name.includes('summit')) category = 'Climbing';
    else if (name.includes('tennis') || name.includes('racquet') || name.includes('squash') || name.includes('pickleball')) category = 'Tennis';
    else if (name.includes('wellness') || name.includes('ymca') || name.includes('recreation') || name.includes('community center') || name.includes('health center')) category = 'Wellness';
    else if (name.includes('physical therapy') || name.includes('rehab') || name.includes('chiropract') || name.includes('sport medicine') || name.includes('recovery')) category = 'Rehabilitation';
    else if (name.includes('sport') || name.includes('athletic') || name.includes('arena') || name.includes('stadium') || name.includes('complex')) category = 'Sports Club';
    
    // Get real photo URL from Google Places
    let imageUrl = '';
    if (place.photos && place.photos.length > 0) {
      imageUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
    }
    // (name already defined above for category detection)
    
    // Use fetched rating (more accurate) or fall back to search result rating
    const rating = fetchedRating ?? place.rating ?? 0;
    const reviewCount = fetchedReviewCount ?? place.user_ratings_total ?? 0;
    
    // Determine price range - Google rarely has this for gyms, so we estimate
    let priceRange = ''; // Empty by default - don't show if we don't know
    
    // Use fetched price level if available (rare for gyms)
    if (fetchedPriceLevel && fetchedPriceLevel > 0) {
      priceRange = '$'.repeat(fetchedPriceLevel);
    } else if (place.price_level && place.price_level > 0) {
      priceRange = '$'.repeat(place.price_level);
    } else {
      // Estimate based on gym name/brand - expanded list
      // Budget ($)
      if (name.includes('planet fitness') || name.includes('crunch') || 
          name.includes('fitness connection') || name.includes('youfit') ||
          name.includes('blink fitness') || name.includes('chuze') ||
          name.includes('esporta') || name.includes('eos fitness') ||
          name.includes('workout anytime') || name.includes('snap fitness')) {
        priceRange = '$';
      }
      // Premium ($$$$)
      else if (name.includes('equinox') || name.includes('lifetime') ||
               name.includes('life time') || name.includes('david barton') ||
               name.includes('barry\'s') || name.includes('barrys') ||
               name.includes('soulcycle') || name.includes('rumble')) {
        priceRange = '$$$$';
      }
      // Upper-mid ($$$)
      else if (name.includes('crossfit') || name.includes('f45') || 
               name.includes('orangetheory') || name.includes('orange theory') ||
               name.includes('9round') || name.includes('title boxing') ||
               name.includes('pure barre') || name.includes('club pilates') ||
               name.includes('solidcore') || name.includes('cyclebar')) {
        priceRange = '$$$';
      }
      // Mid-range ($$) - only for known chains
      else if (name.includes('la fitness') || name.includes('gold\'s') || name.includes('golds') ||
               name.includes('24 hour') || name.includes('ymca') || name.includes('anytime fitness')) {
        priceRange = '$$';
      }
      // For unknown gyms, don't show price (empty string)
    }
    
    return {
      id: place.place_id || `place-${index}`,
      name: place.name || 'Fitness Location',
      category,
      address: place.formatted_address?.split(',')[0] || place.vicinity || '',
      city: place.formatted_address?.split(',')[1]?.trim() || '',
      state: place.formatted_address?.split(',')[2]?.trim().split(' ')[0] || '',
      phone: phone || place.formatted_phone_number || '',
      rating,
      reviewCount,
      image: imageUrl,
      distance: '',
      priceRange,
      amenities: [],
      placeId: place.place_id,
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng(),
    };
  };

  // Fetch place details to get phone number, price level, and rating
  const fetchPlaceDetails = (placeId: string, service: google.maps.places.PlacesService): Promise<{phone: string, priceLevel: number | null, rating: number | null, reviewCount: number | null}> => {
    return new Promise((resolve) => {
      service.getDetails(
        { placeId, fields: ['formatted_phone_number', 'price_level', 'rating', 'user_ratings_total'] },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Debug: log actual Google rating
            console.log(`📊 ${result?.name}: Rating=${result?.rating}, Reviews=${result?.user_ratings_total}, Price=${result?.price_level}`);
            resolve({
              phone: result?.formatted_phone_number || '',
              priceLevel: result?.price_level ?? null,
              rating: result?.rating ?? null,
              reviewCount: result?.user_ratings_total ?? null
            });
          } else {
            console.log(`❌ Failed to get details for ${placeId}: ${status}`);
            resolve({ phone: '', priceLevel: null, rating: null, reviewCount: null });
          }
        }
      );
    });
  };

  // Reusable search function
  const performSearch = useCallback(async (lat: number, lng: number, radius: number) => {
    setIsSearching(true);
    setCurrentLocation({ lat, lng });
    setMapCenter({ lat, lng });
    
    // Wait for Google Maps
    let attempts = 0;
    while (!window.google?.maps?.places && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    
    if (!window.google?.maps?.places) {
      console.log('Google Maps not loaded');
      setIsSearching(false);
      return;
    }
    
    const latlng = new google.maps.LatLng(lat, lng);
    
    // Reverse geocode
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setSearchedAddress(results[0].formatted_address);
      }
    });
    
    // Search nearby
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const allResults: google.maps.places.PlaceResult[] = [];
    let completedSearches = 0;
    const radiusMeters = radius * 1609.34;
    const searchKeywords = [
      // Core fitness
      'gym', 'fitness center', 'health club',
      // Mind-body
      'yoga studio', 'pilates studio', 'barre studio',
      // High intensity
      'crossfit', 'hiit studio', 'bootcamp fitness', 'f45', 'orangetheory',
      // Combat sports
      'boxing gym', 'martial arts', 'mma gym', 'kickboxing',
      // Specialized
      'dance studio', 'cycling studio', 'spin class',
      'swimming pool fitness', 'aquatic center',
      'rock climbing gym', 'climbing wall',
      // Personal training
      'personal trainer', 'personal training studio',
      // Broader fitness
      'sports club', 'recreation center', 'wellness center', 'ymca',
      // Rehab & recovery
      'physical therapy', 'sports rehabilitation',
      // Racquet sports
      'tennis club', 'racquetball', 'pickleball',
      // Stadium / arena fitness
      'stadium fitness', 'arena gym', 'functional fitness',
    ];
    
    // Also do a nearbySearch with type 'gym' to catch all fitness places
    // even if their name doesn't contain a keyword
    const nearbyTypes = ['gym'];
    const totalSearches = searchKeywords.length + nearbyTypes.length;
    let completedNearby = 0;

    nearbyTypes.forEach((type) => {
      service.nearbySearch({ location: latlng, radius: radiusMeters, type }, (results, status) => {
        completedNearby++;
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach((place) => {
            if (!allResults.find((p) => p.place_id === place.place_id)) {
              allResults.push(place);
            }
          });
        }
      });
    });

    searchKeywords.forEach((keyword) => {
      service.textSearch({ location: latlng, radius: radiusMeters, query: keyword }, async (results, status) => {
        completedSearches++;
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach((place) => {
            if (!allResults.find((p) => p.place_id === place.place_id)) {
              allResults.push(place);
            }
          });
        }
        if (completedSearches === searchKeywords.length) {
          allResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          const top30 = allResults.slice(0, 60);
          
          // Fetch details for top results
          const converted: FitnessLocation[] = [];
          for (let i = 0; i < top30.length; i++) {
            const place = top30[i];
            let phone = '';
            let priceLevel: number | null = null;
            let rating: number | null = null;
            let reviewCount: number | null = null;
            if (place.place_id) {
              const details = await fetchPlaceDetails(place.place_id, service);
              phone = details.phone;
              priceLevel = details.priceLevel;
              rating = details.rating;
              reviewCount = details.reviewCount;
            }
            converted.push(convertGooglePlace(place, i, phone, priceLevel, rating, reviewCount));
            
            // Update UI progressively every 5 results
            if ((i + 1) % 5 === 0 || i === top30.length - 1) {
              setRealPlaces([...converted]);
            }
          }
          
          // Fetch member ratings
          const placeIds = converted.map(p => p.placeId).filter(Boolean);
          if (placeIds.length > 0) {
            try {
              const statsResponse = await fetch(`/api/reviews/stats?placeIds=${placeIds.join(',')}`);
              if (statsResponse.ok) {
                const { stats } = await statsResponse.json();
                const updatedPlaces = converted.map(place => {
                  if (place.placeId && stats[place.placeId]) {
                    return {
                      ...place,
                      memberRating: stats[place.placeId].avgRating,
                      memberReviewCount: stats[place.placeId].count,
                    };
                  }
                  return place;
                });
                setRealPlaces(updatedPlaces);
              }
            } catch (err) {
              console.error('Failed to fetch member ratings:', err);
            }
          }
          
          setIsSearching(false);
        }
      });
    });
  }, []);

  // Handle radius change - auto re-search
  const handleRadiusChange = useCallback((newRadius: number) => {
    setSearchRadius(newRadius);
    if (currentLocation) {
      performSearch(currentLocation.lat, currentLocation.lng, newRadius);
    }
  }, [currentLocation, performSearch]);

  // Handle "Use My Location" button
  const handleUseMyLocation = useCallback(async () => {
    setIsSearching(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performSearch(position.coords.latitude, position.coords.longitude, searchRadius);
        },
        async () => {
          // Fallback: Use IP-based geolocation
          try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            if (data.latitude && data.longitude) {
              performSearch(data.latitude, data.longitude, searchRadius);
            } else {
              setIsSearching(false);
            }
          } catch {
            setIsSearching(false);
          }
        },
        { timeout: 5000 }
      );
    } else {
      // No geolocation, use IP-based
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.latitude && data.longitude) {
          performSearch(data.latitude, data.longitude, searchRadius);
        } else {
          setIsSearching(false);
        }
      } catch {
        setIsSearching(false);
      }
    }
  }, [searchRadius, performSearch]);
  
  // Auto-detect location on page load
  useEffect(() => {
    const detectLocation = async () => {
      setIsSearching(true);
      
      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            performSearch(position.coords.latitude, position.coords.longitude, searchRadius);
          },
          async () => {
            // Fallback: Use IP-based geolocation
            try {
              const response = await fetch('https://ipapi.co/json/');
              const data = await response.json();
              if (data.latitude && data.longitude) {
                performSearch(data.latitude, data.longitude, searchRadius);
              } else {
                setIsSearching(false);
              }
            } catch {
              setIsSearching(false);
            }
          },
          { timeout: 5000 }
        );
      } else {
        // No geolocation support, use IP-based
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          if (data.latitude && data.longitude) {
            performSearch(data.latitude, data.longitude, searchRadius);
          } else {
            setIsSearching(false);
          }
        } catch {
          setIsSearching(false);
        }
      }
    };
    
    detectLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handlePlaceSelect = async (place: google.maps.places.PlaceResult, nearbyPlaces: google.maps.places.PlaceResult[]) => {
    setIsSearching(true);
    setSearchedAddress(place.formatted_address || place.name || '');
    setSearchQuery('');
    
    // Set map center and store current location
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMapCenter({ lat, lng });
      setCurrentLocation({ lat, lng }); // Store for radius change re-search
    }
    
    // Log search activity
    try {
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          details: {
            query: place.formatted_address || place.name,
            resultsCount: nearbyPlaces.length,
          },
        }),
      });
    } catch (e) {
      // Don't block on logging failure
    }
    
    // Wait for Google Maps
    let attempts = 0;
    while (!window.google?.maps?.places && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    
    if (!window.google?.maps?.places) {
      // Fallback: convert without details
      const converted = nearbyPlaces.map((p, i) => convertGooglePlace(p, i));
      setRealPlaces(converted);
      setIsSearching(false);
      return;
    }
    
    // Fetch details for each place
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const converted: FitnessLocation[] = [];
    
    for (let i = 0; i < nearbyPlaces.length; i++) {
      const p = nearbyPlaces[i];
      let phone = '';
      let priceLevel: number | null = null;
      let rating: number | null = null;
      let reviewCount: number | null = null;
      
      if (p.place_id) {
        const details = await fetchPlaceDetails(p.place_id, service);
        phone = details.phone;
        priceLevel = details.priceLevel;
        rating = details.rating;
        reviewCount = details.reviewCount;
      }
      
      converted.push(convertGooglePlace(p, i, phone, priceLevel, rating, reviewCount));
      
      // Update UI progressively
      if ((i + 1) % 5 === 0 || i === nearbyPlaces.length - 1) {
        setRealPlaces([...converted]);
      }
    }
    
    // Fetch member ratings for all places
    const placeIds = converted.map(p => p.placeId).filter(Boolean);
    if (placeIds.length > 0) {
      try {
        const statsResponse = await fetch(`/api/reviews/stats?placeIds=${placeIds.join(',')}`);
        if (statsResponse.ok) {
          const { stats } = await statsResponse.json();
          // Update places with member ratings
          const updatedPlaces = converted.map(place => {
            if (place.placeId && stats[place.placeId]) {
              return {
                ...place,
                memberRating: stats[place.placeId].avgRating,
                memberReviewCount: stats[place.placeId].count,
              };
            }
            return place;
          });
          setRealPlaces(updatedPlaces);
        }
      } catch (err) {
        console.error('Failed to fetch member ratings:', err);
      }
    }
    
    setIsSearching(false);
  };

  const activeFiltersCount = [
    selectedDistance !== 'All',
    selectedAmenities.length > 0,
    selectedCategory !== 'All',
    searchQuery.length > 0,
  ].filter(Boolean).length;

  const filteredLocations = realPlaces
    .filter((loc) => {
      const matchesCategory = selectedCategory === 'All' || loc.category === selectedCategory;
      const matchesSearch =
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.amenities || []).some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDistance = (() => {
        if (selectedDistance === 'All') return true;
        const distanceNum = parseFloat(loc.distance || '0');
        if (selectedDistance === 'Under 1 mile') return distanceNum < 1;
        if (selectedDistance === '1-2 miles') return distanceNum >= 1 && distanceNum < 2;
        if (selectedDistance === '2-3 miles') return distanceNum >= 2 && distanceNum < 3;
        if (selectedDistance === '3+ miles') return distanceNum >= 3;
        return true;
      })();

      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((amenity) => (loc.amenities || []).includes(amenity));

      return matchesCategory && matchesSearch && matchesDistance && matchesAmenities;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Rating (High-Low)':
          return (b.rating || 0) - (a.rating || 0);
        case 'Most Reviewed':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'Name (A-Z)':
          return a.name.localeCompare(b.name);
        case 'Name (Z-A)':
          return b.name.localeCompare(a.name);
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Find Fitness Near You</h1>
        <p>Find the perfect gym, studio, or trainer near you</p>
      </section>

      {/* Search & Filters */}
      <section className="py-8 bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <AddressAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onPlaceSelect={handlePlaceSelect}
                radiusMiles={searchRadius}
                placeholder="Search by name, address, city, or amenities..."
                className="w-full px-6 py-4 pl-14 bg-[#1e1e2d] border border-violet-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          
          {/* Show searched address */}
          {searchedAddress && (
            <div className="mb-4 flex items-center gap-2 text-gray-400">
              <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Showing fitness locations near: <span className="text-violet-500 font-semibold">{searchedAddress}</span></span>
              <button 
                onClick={() => { setSearchedAddress(''); setRealPlaces([]); }}
                className="ml-2 text-gray-500 hover:text-white"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Radius Selector */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <button
              onClick={handleUseMyLocation}
              disabled={isSearching}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-gray-900 rounded-lg font-medium hover:bg-violet-400 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isSearching ? 'Searching...' : 'Use My Location'}
            </button>
            
            {/* Radius Control with +/- buttons */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Radius:</span>
              <div className="flex items-center bg-[#1e1e2d] rounded-lg border border-violet-900/30">
                {/* Decrease button */}
                <button
                  onClick={() => {
                    const radiusOptions = [1, 2, 5, 10, 15, 25, 50];
                    const currentIndex = radiusOptions.indexOf(searchRadius);
                    if (currentIndex > 0) {
                      handleRadiusChange(radiusOptions[currentIndex - 1]);
                    }
                  }}
                  disabled={isSearching || searchRadius <= 1}
                  className="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-l-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Decrease radius"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                
                {/* Radius dropdown */}
                <select
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  disabled={isSearching}
                  className="px-3 py-2 bg-transparent text-white text-center font-semibold appearance-none cursor-pointer focus:outline-none disabled:opacity-50 min-w-[80px]"
                >
                  <option value={1} className="bg-gray-800">1 mile</option>
                  <option value={2} className="bg-gray-800">2 miles</option>
                  <option value={5} className="bg-gray-800">5 miles</option>
                  <option value={10} className="bg-gray-800">10 miles</option>
                  <option value={15} className="bg-gray-800">15 miles</option>
                  <option value={25} className="bg-gray-800">25 miles</option>
                  <option value={50} className="bg-gray-800">50 miles</option>
                </select>
                
                {/* Increase button */}
                <button
                  onClick={() => {
                    const radiusOptions = [1, 2, 5, 10, 15, 25, 50];
                    const currentIndex = radiusOptions.indexOf(searchRadius);
                    if (currentIndex < radiusOptions.length - 1) {
                      handleRadiusChange(radiusOptions[currentIndex + 1]);
                    }
                  }}
                  disabled={isSearching || searchRadius >= 50}
                  className="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-r-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Increase radius"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter — horizontal scroll with arrow buttons */}
          <div className="mb-6">
            <div className="relative flex items-center gap-2">
              {/* Left arrow */}
              <button
                onClick={() => scrollCategories('left')}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#1e1e2d] border border-violet-900/30 text-gray-400 hover:text-white hover:border-violet-500 transition-all z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Scrollable category strip */}
              <div
                ref={categoryScrollRef}
                className="flex gap-2 overflow-x-auto flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {categories.map((category) => {
                  const categoryMeta: Record<string, { emoji: string; active: string; hover: string }> = {
                    'All':              { emoji: '🏅', active: 'border-violet-500 bg-violet-500/20 text-violet-300', hover: 'hover:border-violet-500 hover:text-violet-300' },
                    'Gym':              { emoji: '💪', active: 'border-red-500 bg-red-500/20 text-red-300', hover: 'hover:border-red-500 hover:text-red-300' },
                    'Yoga':             { emoji: '🧘', active: 'border-green-500 bg-green-500/20 text-green-300', hover: 'hover:border-green-500 hover:text-green-300' },
                    'Pilates':          { emoji: '🤸', active: 'border-blue-500 bg-blue-500/20 text-blue-300', hover: 'hover:border-blue-500 hover:text-blue-300' },
                    'CrossFit':         { emoji: '🏋️', active: 'border-orange-500 bg-orange-500/20 text-orange-300', hover: 'hover:border-orange-500 hover:text-orange-300' },
                    'Sports Club':      { emoji: '⚽', active: 'border-yellow-500 bg-yellow-500/20 text-yellow-300', hover: 'hover:border-yellow-500 hover:text-yellow-300' },
                    'Personal Trainer': { emoji: '🎯', active: 'border-pink-500 bg-pink-500/20 text-pink-300', hover: 'hover:border-pink-500 hover:text-pink-300' },
                    'Dance':            { emoji: '💃', active: 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300', hover: 'hover:border-fuchsia-500 hover:text-fuchsia-300' },
                    'Martial Arts':     { emoji: '🥋', active: 'border-red-700 bg-red-700/20 text-red-300', hover: 'hover:border-red-700 hover:text-red-300' },
                    'Boxing':           { emoji: '🥊', active: 'border-rose-500 bg-rose-500/20 text-rose-300', hover: 'hover:border-rose-500 hover:text-rose-300' },
                    'Kickboxing':       { emoji: '🦵', active: 'border-red-400 bg-red-400/20 text-red-200', hover: 'hover:border-red-400 hover:text-red-200' },
                    'Swimming':         { emoji: '🏊', active: 'border-cyan-500 bg-cyan-500/20 text-cyan-300', hover: 'hover:border-cyan-500 hover:text-cyan-300' },
                    'Cycling':          { emoji: '🚴', active: 'border-amber-500 bg-amber-500/20 text-amber-300', hover: 'hover:border-amber-500 hover:text-amber-300' },
                    'Barre':            { emoji: '🩰', active: 'border-purple-400 bg-purple-400/20 text-purple-300', hover: 'hover:border-purple-400 hover:text-purple-300' },
                    'Climbing':         { emoji: '🧗', active: 'border-stone-400 bg-stone-400/20 text-stone-300', hover: 'hover:border-stone-400 hover:text-stone-300' },
                    'Tennis':           { emoji: '🎾', active: 'border-lime-500 bg-lime-500/20 text-lime-300', hover: 'hover:border-lime-500 hover:text-lime-300' },
                    'Pickleball':       { emoji: '🏓', active: 'border-lime-400 bg-lime-400/20 text-lime-200', hover: 'hover:border-lime-400 hover:text-lime-200' },
                    'Weightlifting':    { emoji: '🏋️', active: 'border-gray-400 bg-gray-400/20 text-gray-300', hover: 'hover:border-gray-400 hover:text-gray-300' },
                    'Gymnastics':       { emoji: '🤼', active: 'border-indigo-500 bg-indigo-500/20 text-indigo-300', hover: 'hover:border-indigo-500 hover:text-indigo-300' },
                    'Rowing':           { emoji: '🚣', active: 'border-blue-700 bg-blue-700/20 text-blue-300', hover: 'hover:border-blue-700 hover:text-blue-300' },
                    'Running':          { emoji: '🏃', active: 'border-emerald-500 bg-emerald-500/20 text-emerald-300', hover: 'hover:border-emerald-500 hover:text-emerald-300' },
                    'Stretching':       { emoji: '🙆', active: 'border-violet-300 bg-violet-300/20 text-violet-200', hover: 'hover:border-violet-300 hover:text-violet-200' },
                    'Sauna & Recovery': { emoji: '🧖', active: 'border-orange-600 bg-orange-600/20 text-orange-300', hover: 'hover:border-orange-600 hover:text-orange-300' },
                    'Wellness':         { emoji: '🌿', active: 'border-teal-500 bg-teal-500/20 text-teal-300', hover: 'hover:border-teal-500 hover:text-teal-300' },
                    'Rehabilitation':   { emoji: '🩺', active: 'border-sky-500 bg-sky-500/20 text-sky-300', hover: 'hover:border-sky-500 hover:text-sky-300' },
                  };
                  const meta = categoryMeta[category] || categoryMeta['All'];
                  const isActive = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? meta.active + ' border'
                          : 'border-gray-700 text-gray-400 bg-transparent ' + meta.hover
                      }`}
                    >
                      <span>{meta.emoji}</span>
                      <span>{category}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scrollCategories('right')}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#1e1e2d] border border-violet-900/30 text-gray-400 hover:text-white hover:border-violet-500 transition-all z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-6 py-3 bg-[#1e1e2d] hover:bg-gray-700 text-white rounded-lg border border-violet-900/30 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span className="font-semibold">Advanced Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-violet-500 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mb-6 bg-[#1e1e2d] rounded-lg border border-violet-900/30 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Distance Filter */}
                <div>
                  <label className="block text-white font-semibold mb-3">Distance</label>
                  <div className="space-y-2">
                    {distanceOptions.map((distance) => (
                      <button
                        key={distance}
                        onClick={() => setSelectedDistance(distance)}
                        className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-300 ${
                          selectedDistance === distance
                            ? 'bg-violet-500 text-gray-900 font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {distance}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities Filter */}
                <div>
                  <label className="block text-white font-semibold mb-3">
                    Amenities ({selectedAmenities.length} selected)
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {allAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`w-full px-4 py-2 rounded-lg text-left text-sm transition-all duration-300 flex items-center space-x-2 ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-violet-500 text-gray-900 font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedAmenities.includes(amenity)
                              ? 'border-gray-900 bg-gray-900'
                              : 'border-gray-500'
                          }`}
                        >
                          {selectedAmenities.includes(amenity) && (
                            <svg className="w-3 h-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="flex-1">{amenity}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <div className="mt-6 pt-6 border-t border-violet-900/30">
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Clear All Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sort & Results Count */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-gray-400">
              Found <span className="text-violet-500 font-semibold">{filteredLocations.length}</span> location
              {filteredLocations.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-3">
              <label htmlFor="sort" className="text-gray-400 text-sm">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-[#1e1e2d] border border-violet-900/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Grid with Map */}
      <section className="py-8 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4">
          {/* Map Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showMap 
                  ? 'bg-violet-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {/* Map Section */}
          {showMap && mapCenter && (
            <div className="mb-6 rounded-xl overflow-hidden border border-violet-900/30">
              <div id="locations-map" className="w-full h-[400px] bg-gray-800">
                <GoogleMap 
                  center={mapCenter} 
                  places={filteredLocations}
                  onMarkerClick={(place) => setSelectedPlace(place)}
                  selectedPlace={selectedPlace}
                  radius={searchRadius}
                />
              </div>
              {selectedPlace && (
                <div className="bg-[#1e1e2d] p-4 border-t border-violet-900/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">{selectedPlace.name}</h3>
                      <p className="text-gray-400 text-sm">{selectedPlace.address}, {selectedPlace.city}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedPlace.rating > 0 && (
                          <span className="text-yellow-400 text-sm">★ {selectedPlace.rating.toFixed(1)}</span>
                        )}
                        <span className="text-violet-400 text-sm">{selectedPlace.category}</span>
                      </div>
                    </div>
                    <Link
                      href={`/locations/${selectedPlace.placeId || selectedPlace.id}`}
                      className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-semibold"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {isSearching && realPlaces.length === 0 ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-500 border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold text-white mb-3">Searching 30+ fitness categories near you...</h3>
              <p className="text-gray-400">Gyms, studios, courts, pools, trainers and more</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No locations found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold rounded-lg transition-all duration-300"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((location) => (
                <FitnessLocationCard key={location.id} location={location} onSave={handleSave} isSaved={savedLocations.includes(location.id)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
