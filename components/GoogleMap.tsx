'use client';

import { useEffect, useRef, useState } from 'react';
import { FitnessLocation } from './FitnessLocationCard';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  places: FitnessLocation[];
  onMarkerClick?: (place: FitnessLocation) => void;
  selectedPlace?: FitnessLocation | null;
  radius?: number; // miles - for dynamic zoom
}

// Category colors - MUST match FitnessLocationCard colors
const categoryColors: Record<string, { bg: string; text: string; hex: string }> = {
  'Gym': { bg: 'bg-red-500', text: 'text-red-400', hex: '#ef4444' },
  'Yoga': { bg: 'bg-green-500', text: 'text-green-400', hex: '#22c55e' },
  'Pilates': { bg: 'bg-blue-500', text: 'text-blue-400', hex: '#3b82f6' },
  'Cross Training': { bg: 'bg-orange-500', text: 'text-orange-400', hex: '#f97316' },
  'Sports Club': { bg: 'bg-yellow-500', text: 'text-yellow-400', hex: '#eab308' },
  'Personal Trainer': { bg: 'bg-pink-500', text: 'text-pink-400', hex: '#ec4899' },
};

// Professional SVG icons for each category
const categoryIconPaths: Record<string, string> = {
  'Gym': 'M6.5 6.5h3v11h-3zM14.5 6.5h3v11h-3zM2 9h20v6H2z', // Dumbbell
  'Yoga': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', // Lotus/meditation
  'Pilates': 'M12 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m9 12v-2c-2.24 0-4.16-.96-5.5-2.5l-1.07-1.28c-.44-.52-1.06-.84-1.73-.95L10 9l-3.2.79c-.83.21-1.46.86-1.62 1.7L4 18h2.1l.9-4.2 2 2V18h2v-4.7l-2-2 .56-2.52 1.42 1.69c.89 1.07 2.2 1.68 3.58 1.7L16 14v4h2v-4c0-1.4-.72-2.64-1.8-3.37l1.94-1.06C19.5 11.3 21 13.42 21 16z', // Person stretching
  'Cross Training': 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z', // Crossed weights
  'Sports Club': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z', // Person/ball
  'Personal Trainer': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', // Person
};

export function getCategoryColor(category: string) {
  return categoryColors[category] || { bg: 'bg-gray-500', text: 'text-gray-400', hex: '#6b7280' };
}

export default function GoogleMap({ center, places, onMarkerClick, selectedPlace, radius = 10 }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Calculate zoom level based on radius
  const getZoomForRadius = (radiusMiles: number): number => {
    // Approximate zoom levels for different radii
    if (radiusMiles <= 1) return 15;
    if (radiusMiles <= 2) return 14;
    if (radiusMiles <= 5) return 12;
    if (radiusMiles <= 10) return 11;
    if (radiusMiles <= 15) return 10;
    if (radiusMiles <= 25) return 9;
    if (radiusMiles <= 50) return 8;
    return 7;
  };

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkLoaded = () => {
      if (window.google?.maps) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkLoaded()) return;

    const interval = setInterval(() => {
      if (checkLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: getZoomForRadius(radius),
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1e1e2d' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1e1e2d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
        { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
        { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
      ],
    });
  }, [isLoaded, center]);

  // Update center and zoom when they change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(getZoomForRadius(radius));
    }
  }, [center, radius]);

  // Create professional marker icon
  const createMarkerIcon = (category: string, isSelected: boolean) => {
    const color = getCategoryColor(category).hex;
    const iconPath = categoryIconPaths[category] || 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';
    const size = isSelected ? 44 : 36;
    const strokeWidth = isSelected ? 2.5 : 1.5;
    const shadowOpacity = isSelected ? 0.5 : 0.3;
    
    // Professional marker SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
        <defs>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="${shadowOpacity}"/>
          </filter>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <!-- Pin shape -->
        <path d="M${size/2} ${size + 6} 
                 L${size * 0.7} ${size * 0.55}
                 A${size * 0.38} ${size * 0.38} 0 1 0 ${size * 0.3} ${size * 0.55}
                 Z" 
              fill="url(#grad)" 
              stroke="${isSelected ? '#ffffff' : 'rgba(0,0,0,0.3)'}" 
              stroke-width="${strokeWidth}"
              filter="url(#shadow)"/>
        <!-- Inner circle -->
        <circle cx="${size/2}" cy="${size * 0.38}" r="${size * 0.26}" fill="white" opacity="0.95"/>
        <!-- Icon -->
        <g transform="translate(${size/2 - 10}, ${size * 0.38 - 10}) scale(0.85)">
          <path d="${iconPath}" fill="${color}"/>
        </g>
      </svg>
    `;
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(size, size + 10),
      anchor: new google.maps.Point(size/2, size + 6),
    };
  };

  // Add/update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add center marker (search location) - professional purple dot with pulse effect
    const centerMarker = new google.maps.Marker({
      position: center,
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#8b5cf6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      title: 'Your Search Location',
      zIndex: 1000,
    });
    markersRef.current.push(centerMarker);

    // Add place markers
    places.forEach((place, index) => {
      let position: google.maps.LatLngLiteral | null = null;
      
      if (place.lat && place.lng) {
        position = { lat: place.lat, lng: place.lng };
      } else if (place.distance) {
        const distanceMiles = parseFloat(place.distance);
        const angle = (index * 137.5) * (Math.PI / 180);
        const latOffset = (distanceMiles / 69) * Math.cos(angle);
        const lngOffset = (distanceMiles / 69) * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180);
        position = {
          lat: center.lat + latOffset,
          lng: center.lng + lngOffset,
        };
      }

      if (!position) return;

      const isSelected = selectedPlace?.id === place.id;

      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        icon: createMarkerIcon(place.category, isSelected),
        title: `${place.name} (${place.category})`,
        zIndex: isSelected ? 999 : index,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        onMarkerClick?.(place);
      });

      markersRef.current.push(marker);
    });
  }, [places, center, isLoaded, selectedPlace, onMarkerClick]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
