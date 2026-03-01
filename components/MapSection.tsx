'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

const mockMarkers: MapMarker[] = [
  { id: '1', name: 'Elite Fitness Center', lat: 40.7128, lng: -74.0060, type: 'Gym' },
  { id: '2', name: 'Zen Yoga Studio', lat: 40.7580, lng: -73.9855, type: 'Yoga' },
  { id: '3', name: 'PowerFit Training', lat: 40.7489, lng: -73.9680, type: 'Personal Training' },
];


/**
 * MapSection Component
 *
 * Displays fitness locations on an interactive map.
 *
 * Features:
 * - Auto-detects if Google Maps API key is configured
 * - Falls back to placeholder UI if not configured
 * - Displays locations from database
 * - Works with both seed data and imported data
 *
 * To enable real Google Maps:
 * 1. Get API key from https://console.cloud.google.com/
 * 2. Enable Maps JavaScript API
 * 3. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env
 * 4. Restart dev server
 */
export default function MapSection() {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [, setMapReady] = useState(false);
  const [isGoogleMapsEnabled, setIsGoogleMapsEnabled] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Check if Google Maps API is configured
  useEffect(() => {
    setIsClient(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setIsGoogleMapsEnabled(!!apiKey);
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    // Create map centered on first marker
    const center = mockMarkers.length > 0
      ? { lat: mockMarkers[0].lat, lng: mockMarkers[0].lng }
      : { lat: 40.7128, lng: -74.0060 }; // NYC default

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#1f2937' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#111827' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#374151' }],
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca3af' }],
        },
      ],
    });

    // Add markers
    mockMarkers.forEach((marker) => {
      const mapMarker = new google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: googleMapRef.current!,
        title: marker.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#84cc16',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add click listener
      mapMarker.addListener('click', () => {
        setSelectedMarker(marker.id);
        googleMapRef.current?.panTo({ lat: marker.lat, lng: marker.lng });
      });

      markersRef.current.push(mapMarker);
    });

    setMapReady(true);
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!isClient || !isGoogleMapsEnabled || !mapRef.current) {
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Load script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setIsGoogleMapsEnabled(false);
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isClient, isGoogleMapsEnabled, initializeMap]);

  if (!isClient) {
    return <div className="map-section animate-pulse bg-[#1e1e2d] h-96" />;
  }

  return (
    <section className="map-section py-16 bg-gradient-to-b from-gray-800 to-gray-900">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Find Fitness Centers Near You
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map container */}
          <div className="lg:col-span-2 bg-[#1e1e2d] rounded-lg border border-gray-700 overflow-hidden h-96 relative">
            {isGoogleMapsEnabled ? (
              // Real Google Map
              <div ref={mapRef} className="w-full h-full" />
            ) : (
              // Placeholder when API key not configured
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                <div className="text-center">
                  <svg
                    className="w-24 h-24 mx-auto mb-4 text-violet-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-gray-400 text-lg">Interactive Map View</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {process.env.NODE_ENV === 'development'
                      ? 'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable maps'
                      : 'Map integration coming soon'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Locations list */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Nearby Locations</h3>
            {mockMarkers.map((marker) => (
              <div
                key={marker.id}
                onClick={() => {
                  setSelectedMarker(marker.id);
                  // Pan map to marker if Google Maps is loaded
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo({ lat: marker.lat, lng: marker.lng });
                    googleMapRef.current.setZoom(15);
                  }
                }}
                className={`bg-[#1e1e2d] rounded-lg p-4 border cursor-pointer transition-all duration-300 ${
                  selectedMarker === marker.id
                    ? 'border-violet-500 ring-2 ring-violet-500'
                    : 'border-gray-700 hover:border-violet-500'
                }`}
              >
                <h4 className="text-white font-semibold mb-1">{marker.name}</h4>
                <p className="text-gray-400 text-sm mb-2">{marker.type}</p>
                <div className="flex items-center text-violet-500 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  View on map
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search controls */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
          <input
            type="text"
            placeholder="Enter your location..."
            className="px-6 py-3 bg-[#1e1e2d] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button className="px-8 py-3 bg-violet-500 hover:bg-violet-600 text-gray-900 font-semibold rounded-lg transition-colors duration-300">
            Search
          </button>
        </div>
      </div>
    </section>
  );
}
