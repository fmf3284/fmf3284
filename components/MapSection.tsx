'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  address: string;
  rating?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Gym': '💪', 'Yoga': '🧘', 'Pilates': '🤸', 'CrossFit': '🏋️',
  'Swimming': '🏊', 'Cycling': '🚴', 'Boxing': '🥊', 'Martial Arts': '🥋',
  'Dance': '💃', 'Climbing': '🧗', 'Tennis': '🎾', 'Wellness': '🌿',
};

export default function MapSection() {
  const router = useRouter();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const mapMarkersRef = useRef<google.maps.Marker[]>([]);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => { setIsClient(true); }, []);

  const clearMarkers = () => {
    mapMarkersRef.current.forEach(m => m.setMap(null));
    mapMarkersRef.current = [];
  };

  const addMarker = useCallback((place: MapMarker) => {
    if (!googleMapRef.current) return;
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map: googleMapRef.current,
      title: place.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#8b5cf6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });
    marker.addListener('click', () => {
      setSelectedMarker(place.id);
      googleMapRef.current?.panTo({ lat: place.lat, lng: place.lng });
      googleMapRef.current?.setZoom(16);
    });
    mapMarkersRef.current.push(marker);
  }, []);

  // Detect category from place types
  const detectCategory = (types: string[], name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('yoga') || n.includes('bikram') || n.includes('hot yoga')) return 'Yoga';
    if (n.includes('pilates') || n.includes('reformer')) return 'Pilates';
    if (n.includes('crossfit') || n.includes('cross fit')) return 'CrossFit';
    if (n.includes('boxing') || n.includes('title box')) return 'Boxing';
    if (n.includes('kickbox') || n.includes('muay thai')) return 'Kickboxing';
    if (n.includes('martial art') || n.includes('karate') || n.includes('jiu jitsu') || n.includes('bjj') || n.includes('taekwondo')) return 'Martial Arts';
    if (n.includes('swim') || n.includes('aquatic')) return 'Swimming';
    if (n.includes('cycl') || n.includes('spin') || n.includes('soulcycle') || n.includes('cyclebar')) return 'Cycling';
    if (n.includes('dance') || n.includes('ballet') || n.includes('zumba')) return 'Dance';
    if (n.includes('climb') || n.includes('boulder')) return 'Climbing';
    if (n.includes('tennis') || n.includes('racquet')) return 'Tennis';
    if (n.includes('barre') || n.includes('pure barre')) return 'Barre';
    if (n.includes('wellness') || n.includes('ymca') || n.includes('recreation')) return 'Wellness';
    if (n.includes('physical therapy') || n.includes('rehab')) return 'Rehabilitation';
    if (types.includes('gym')) return 'Gym';
    return 'Fitness';
  };

  const searchNearby = useCallback((location: { lat: number; lng: number }) => {
    if (!placesServiceRef.current) return;
    setSearching(true);
    setMarkers([]);
    clearMarkers();

    const allResults = new Map<string, google.maps.places.PlaceResult>();

    // Search multiple keywords to get all fitness types
    const keywords = ['gym', 'yoga studio', 'pilates', 'crossfit', 'fitness center', 'martial arts', 'boxing gym', 'dance studio', 'swimming pool fitness', 'cycling studio'];
    let completed = 0;

    const finalize = () => {
      completed++;
      if (completed < keywords.length) return;

      setSearching(false);
      const results = Array.from(allResults.values());
      if (results.length === 0) return;

      const newMarkers: MapMarker[] = results.map((p, i) => ({
        id: p.place_id || String(i),
        name: p.name || 'Unknown',
        lat: p.geometry!.location!.lat(),
        lng: p.geometry!.location!.lng(),
        type: detectCategory(p.types || [], p.name || ''),
        address: p.vicinity || '',
        rating: p.rating,
      }));

      // Sort by rating descending
      newMarkers.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      setMarkers(newMarkers);
      newMarkers.forEach(m => addMarker(m));

      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
      googleMapRef.current?.fitBounds(bounds);
    };

    keywords.forEach(keyword => {
      placesServiceRef.current!.nearbySearch(
        {
          location: new google.maps.LatLng(location.lat, location.lng),
          radius: 8000,
          keyword,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(p => {
              if (p.place_id && p.geometry?.location) {
                allResults.set(p.place_id, p);
              }
            });
          }
          finalize();
        }
      );
    });
  }, [addMarker]);

  const initMap = useCallback((center: { lat: number; lng: number }) => {
    if (!mapRef.current || !window.google) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      styles: [
        { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f1a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e1e30' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e1e30' }] },
        { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#8b8baa' }] },
        { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // Invisible div for PlacesService
    const dummy = document.createElement('div');
    placesServiceRef.current = new google.maps.places.PlacesService(googleMapRef.current);

    // Setup Autocomplete on input
    if (inputRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment'],
        fields: ['geometry', 'formatted_address', 'name'],
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current!.getPlace();
        if (place.geometry?.location) {
          const loc = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setInputValue(place.formatted_address || place.name || '');
          googleMapRef.current?.setCenter(loc);
          googleMapRef.current?.setZoom(14);
          searchNearby(loc);
        }
      });
    }

    setMapsReady(true);
    searchNearby(center);
  }, [searchNearby]);

  // Load Google Maps + try geolocation
  useEffect(() => {
    if (!isClient || !apiKey) return;

    const load = () => {
      if (window.google?.maps) {
        // Try user's location first
        navigator.geolocation?.getCurrentPosition(
          pos => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            initMap(loc);
          },
          () => initMap({ lat: 30.2672, lng: -97.7431 }) // Austin TX default
        );
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        navigator.geolocation?.getCurrentPosition(
          pos => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            initMap(loc);
          },
          () => initMap({ lat: 30.2672, lng: -97.7431 })
        );
      };
      document.head.appendChild(script);
    };

    load();
    return () => {
      mapMarkersRef.current.forEach(m => m.setMap(null));
      mapMarkersRef.current = [];
    };
  }, [isClient, apiKey, initMap]);

  const handleSearchClick = () => {
    if (!inputValue.trim() || !mapsReady) return;
    // If user typed manually (didn't pick autocomplete suggestion), geocode it
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: inputValue }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        googleMapRef.current?.setCenter(loc);
        googleMapRef.current?.setZoom(14);
        searchNearby(loc);
      }
    });
  };

  const handleViewAll = () => {
    if (userLocation) {
      router.push(`/locations?lat=${userLocation.lat}&lng=${userLocation.lng}`);
    } else {
      router.push('/locations');
    }
  };

  if (!isClient) return <div className="map-section animate-pulse bg-[#1e1e2d] h-96" />;

  if (!apiKey) {
    return (
      <section className="py-16 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Find Fitness Near You</h2>
          <p className="text-gray-400 mb-6">Search thousands of gyms, studios and trainers in your area.</p>
          <button onClick={() => router.push('/locations')}
            className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all hover:scale-105">
            🔍 Search Locations
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="map-section py-16 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          Find Fitness Near You
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Search any address or allow location access to see gyms near you
        </p>

        {/* Search bar with autocomplete */}
        <div className="flex gap-3 max-w-2xl mx-auto mb-8">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
              placeholder="Search city, address, or zip code..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(139,92,246,0.3)',
              }}
            />
          </div>
          <button
            onClick={handleSearchClick}
            disabled={searching || !mapsReady}
            className="px-6 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:scale-105 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
          >
            {searching ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Searching...
              </span>
            ) : '🔍 Search'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border"
            style={{ border: '1px solid rgba(139,92,246,0.2)', height: '420px' }}>
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Results sidebar */}
          <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '420px' }}>
            {searching ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl p-4 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              ))
            ) : markers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <span className="text-4xl mb-3">📍</span>
                <p className="text-gray-400 text-sm">Search an address to see<br/>nearby fitness locations</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-xs px-1">{markers.length} locations found nearby</p>
                {markers.map(marker => (
                  <button
                    key={marker.id}
                    onClick={() => {
                      setSelectedMarker(marker.id);
                      googleMapRef.current?.panTo({ lat: marker.lat, lng: marker.lng });
                      googleMapRef.current?.setZoom(16);
                    }}
                    className="text-left rounded-xl p-4 transition-all"
                    style={{
                      background: selectedMarker === marker.id
                        ? 'rgba(139,92,246,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      border: selectedMarker === marker.id
                        ? '1px solid rgba(139,92,246,0.6)'
                        : '1px solid rgba(139,92,246,0.1)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">
                        {CATEGORY_ICONS[marker.type] || '🏃'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm leading-tight truncate">{marker.name}</p>
                        <p className="text-violet-400 text-xs mt-0.5">{marker.type}</p>
                        {marker.address && (
                          <p className="text-gray-500 text-xs mt-1 truncate">{marker.address}</p>
                        )}
                        {marker.rating && (
                          <p className="text-amber-400 text-xs mt-1">⭐ {marker.rating.toFixed(1)}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <button onClick={handleViewAll}
            className="px-8 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            View All Locations & Advanced Filters →
          </button>
        </div>
      </div>
    </section>
  );
}
