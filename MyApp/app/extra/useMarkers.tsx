// /hooks/useMarkers.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LatLng } from 'react-native-maps';
import { GooglePlacesService } from '../services/googlePlacesService';

export type MarkerData = {
  id: string;
  coordinate: LatLng;
  name: string;
  address?: string;
  category?: string;
  pinColor?: string;
  timestamp?: number;
};

export type CacheData = {
  markers: MarkerData[];
  timestamp: number;
};

const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas

export function useMarkers(confirmedTypes: string[], userLocation: LatLng | null) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [placeCache, setPlaceCache] = useState<Record<string, CacheData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Memoriza la instancia del servicio para que no se recree en cada render
  const placesService = useMemo(() => new GooglePlacesService({ apiKey: 'APIKEY' }), []);

  // Función para saber si el caché está expirado
  const isCacheExpired = (timestamp: number) => {
    return Date.now() - timestamp > CACHE_EXPIRY_TIME;
  };

  // Limpieza del caché
  const cleanupCache = useCallback(() => {
    setPlaceCache(prev => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(updated).forEach(key => {
        if (isCacheExpired(updated[key].timestamp)) {
          delete updated[key];
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, []);

  useEffect(() => {
    cleanupCache();
    const id = setInterval(cleanupCache, CACHE_EXPIRY_TIME / 24);
    return () => clearInterval(id);
  }, [cleanupCache]);

  // Función para actualizar los marcadores
  const updateMarkers = useCallback(async () => {
    setIsLoading(true);
    let newMarkers: MarkerData[] = [];
    const typesToFetch: string[] = [];

    // Para cada tipo confirmado (excluyendo "favoritos")
    for (const type of confirmedTypes) {
      if (type.toLowerCase() === 'favoritos') continue;
      const cached = placeCache[type];
      if (cached && cached.markers.length > 0 && !isCacheExpired(cached.timestamp)) {
        newMarkers = newMarkers.concat(cached.markers);
      } else {
        typesToFetch.push(type);
      }
    }

    // Si hay tipos sin datos en caché, se obtienen de la API
    if (typesToFetch.length > 0) {
      const location = userLocation || { latitude: 32.6245, longitude: -115.4523 };
      for (const type of typesToFetch) {
        try {
          console.log(`Fetching places for: ${type}`);
          const results = await placesService.fetchPlaces({
            latitude: location.latitude,
            longitude: location.longitude,
            query: type,
          });
          if (results && results.length > 0) {
            const typeMarkers: MarkerData[] = results
              .filter((place: any) => place && place.geometry)
              .map((place: any) => {
                const { lat, lng } = place.geometry.location;
                const markerId = place.place_id || `manual_${lat}_${lng}`;
                let pinColor = '#FF0000';
                switch (type) {
                  case 'gym': pinColor = '#9C27B0'; break;
                  case 'store': pinColor = '#2196F3'; break;
                  case 'bar': pinColor = '#FF9800'; break;
                  case 'restaurant': pinColor = '#4CAF50'; break;
                }
                return {
                  id: markerId,
                  coordinate: { latitude: lat, longitude: lng },
                  name: place.name || 'Unknown Place',
                  address: place.formatted_address || '',
                  category: type,
                  pinColor,
                  timestamp: Date.now(),
                } as MarkerData;
              });
            // Actualiza el caché para este tipo
            setPlaceCache(prev => ({
              ...prev,
              [type]: { markers: typeMarkers, timestamp: Date.now() }
            }));
            newMarkers = newMarkers.concat(typeMarkers);
          }
        } catch (error) {
          console.error(`Error fetching places for ${type}:`, error);
        }
      }
    }
    setMarkers(newMarkers);
    setIsLoading(false);
  }, [confirmedTypes, userLocation, placesService, placeCache]);

  // Actualiza los marcadores cada vez que cambien los tipos confirmados
  useEffect(() => {
    if (confirmedTypes.length > 0) {
      const timer = setTimeout(() => {
        updateMarkers();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setMarkers([]);
    }
  }, [confirmedTypes, updateMarkers]);

  return { markers, isLoading };
}
