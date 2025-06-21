import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { 
  getCurrentLocation, 
  getMapLocations, 
  addMapLocation, 
  deleteMapLocation,
  MapLocation,
  getAddressFromCoordinates,
  searchLocation
} from '../services/locationService';

export function useMap(userId: string | null) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Location.LocationGeocodedLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar ubicación del usuario
  const loadUserLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const location = await getCurrentLocation();
      
      if (location) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } else {
        setError('No se pudo obtener tu ubicación actual');
      }
    } catch (err) {
      console.error('Error cargando ubicación del usuario:', err);
      setError('Error al cargar tu ubicación');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Cargar ubicaciones del mapa según el filtro
  const loadMapLocations = useCallback(async () => {
    try {
      setLoadingLocations(true);
      
      const locations = await getMapLocations(locationFilter);
      setMapLocations(locations);
    } catch (err) {
      console.error('Error cargando ubicaciones del mapa:', err);
    } finally {
      setLoadingLocations(false);
    }
  }, [locationFilter]);
  
  // Efectos iniciales
  useEffect(() => {
    loadUserLocation();
  }, [loadUserLocation]);
  
  useEffect(() => {
    loadMapLocations();
  }, [loadMapLocations]);
  
  // Cambiar filtro de ubicaciones
  const changeFilter = (filter: string) => {
    setLocationFilter(filter);
  };
  
  // Seleccionar una ubicación
  const selectLocation = (location: MapLocation | null) => {
    setSelectedLocation(location);
  };
  
  // Buscar ubicación por nombre
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchQuery(query);
      
      const results = await searchLocation(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error en búsqueda de ubicaciones:', err);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Agregar una nueva ubicación
  const addLocation = async (
    newLocation: Omit<MapLocation, 'id' | 'createdAt' | 'createdBy'>
  ) => {
    if (!userId) {
      setError('Debes iniciar sesión para agregar ubicaciones');
      return null;
    }
    
    try {
      // Conseguir dirección si no se proporcionó
      let address = newLocation.address;
      if (!address) {
        address = await getAddressFromCoordinates(
          newLocation.coordinates.latitude,
          newLocation.coordinates.longitude
        );
      }
      
      const locationWithAddress = {
        ...newLocation,
        address
      };
      
      const locationId = await addMapLocation(locationWithAddress, userId);
      
      if (locationId) {
        // Recargar ubicaciones para incluir la nueva
        loadMapLocations();
        return locationId;
      }
      
      return null;
    } catch (err) {
      console.error('Error agregando ubicación:', err);
      setError('No se pudo agregar la ubicación');
      return null;
    }
  };
  
  // Eliminar una ubicación
  const removeLocation = async (locationId: string) => {
    if (!userId) {
      setError('Debes iniciar sesión para eliminar ubicaciones');
      return false;
    }
    
    try {
      const success = await deleteMapLocation(locationId, userId);
      
      if (success) {
        // Actualizar lista de ubicaciones
        setMapLocations(prev => prev.filter(loc => loc.id !== locationId));
        
        // Si la ubicación eliminada era la seleccionada, deseleccionar
        if (selectedLocation?.id === locationId) {
          setSelectedLocation(null);
        }
      }
      
      return success;
    } catch (err) {
      console.error('Error eliminando ubicación:', err);
      setError('No se pudo eliminar la ubicación');
      return false;
    }
  };
  
  // Ir a una ubicación específica
  const goToLocation = (coordinates: { latitude: number; longitude: number }) => {
    // Esta función será implementada en el componente que use este hook,
    // ya que requiere acceso a la referencia del mapa
    return coordinates;
  };
  
  return {
    userLocation,
    mapLocations,
    selectedLocation,
    loading,
    loadingLocations,
    locationFilter,
    searchResults,
    searchQuery,
    isSearching,
    error,
    loadUserLocation,
    loadMapLocations,
    changeFilter,
    selectLocation,
    handleSearch,
    addLocation,
    removeLocation,
    goToLocation,
    setSearchQuery
  };
}