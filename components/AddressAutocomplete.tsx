'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult, nearbyPlaces: google.maps.places.PlaceResult[]) => void;
  placeholder?: string;
  className?: string;
  radiusMiles?: number;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search by address...",
  className = "",
  radiusMiles = 10,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      console.log('Google Maps API key not configured');
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => checkGoogleMaps());
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => checkGoogleMaps();
    document.head.appendChild(script);
  }, []);

  const searchNearbyPlaces = useCallback(async (location: google.maps.LatLng): Promise<google.maps.places.PlaceResult[]> => {
    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      const allResults: google.maps.places.PlaceResult[] = [];
      let completedSearches = 0;

      // Convert miles to meters (1 mile = 1609.34 meters)
      const radiusMeters = radiusMiles * 1609.34;
      console.log(`Searching within ${radiusMiles} miles (${radiusMeters}m)`);

      const searchKeywords = ['gym', 'fitness center', 'yoga studio', 'pilates', 'crossfit', 'personal trainer', 'sports club'];

      searchKeywords.forEach((keyword) => {
        const request: google.maps.places.TextSearchRequest = {
          location: location,
          radius: radiusMeters,
          query: keyword,
        };

        service.textSearch(request, (results, status) => {
          completedSearches++;
          console.log(`Search for "${keyword}": ${status}, found ${results?.length || 0}`);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach((place) => {
              if (!allResults.find((p) => p.place_id === place.place_id)) {
                allResults.push(place);
              }
            });
          }
          
          if (completedSearches === searchKeywords.length) {
            allResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            console.log(`Total unique places found: ${allResults.length}`);
            resolve(allResults.slice(0, 30));
          }
        });
      });
    });
  }, [radiusMiles]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      fields: ['place_id', 'formatted_address', 'name', 'geometry', 'types'],
    });

    autocompleteRef.current.addListener('place_changed', async () => {
      const place = autocompleteRef.current?.getPlace();
      console.log('Place selected:', place);
      
      if (place?.geometry?.location) {
        onChange(place.formatted_address || place.name || '');
        const nearbyPlaces = await searchNearbyPlaces(place.geometry.location);
        onPlaceSelect?.(place, nearbyPlaces);
      }
    });
  }, [isLoaded, onChange, onPlaceSelect, searchNearbyPlaces]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
