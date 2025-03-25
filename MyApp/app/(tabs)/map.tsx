import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, LatLng } from 'react-native-maps';
import { GooglePlacesService } from '../services/googlePlacesService';

type MarkerData = {
  id: string;
  coordinate: LatLng;
  name: string;
  address?: string;
  category?: string;
  pinColor?: string;
  timestamp?: number; // Add timestamp for cache expiration
};

type CacheData = {
  markers: MarkerData[];
  timestamp: number;
};

const availablePlaceTypes = ['gym', 'store', 'bar', 'restaurant', 'favoritos'];
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function MapScreen() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [favoriteMarkers, setFavoriteMarkers] = useState<MarkerData[]>([]);
  const [pendingTypes, setPendingTypes] = useState<string[]>([]);
  const [confirmedTypes, setConfirmedTypes] = useState<string[]>([]);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualMarkerCoords, setManualMarkerCoords] = useState<LatLng | null>(null);
  const [manualMarkerName, setManualMarkerName] = useState('');
  const [placeCache, setPlaceCache] = useState<Record<string, CacheData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const CENTER: LatLng = { latitude: 32.6245, longitude: -115.4523 };

  const defaultMarkers: MarkerData[] = React.useMemo(() => [
    {
      id: 'default1',
      coordinate: { latitude: 32.6280, longitude: -115.4550 },
      name: 'Lugar de Interés',
      address: 'Información general',
      pinColor: '#6200ee',
    },
  ], []);

  // Initialize the Google Places service
  const placesService = new GooglePlacesService({ apiKey: 'APIKEY' });

  // Initialize pendingTypes with confirmedTypes on mount
  useEffect(() => {
    setPendingTypes(confirmedTypes);
    // Load favorite markers from storage if needed
    // loadFavoriteMarkers();
  }, []);

  // Check if cache is expired
  const isCacheExpired = (timestamp: number) => {
    return Date.now() - timestamp > CACHE_EXPIRY_TIME;
  };

  // Clean up any expired cache entries
  const cleanupCache = useCallback(() => {
    const updatedCache = { ...placeCache };
    let hasRemovedEntries = false;

    for (const type in updatedCache) {
      if (isCacheExpired(updatedCache[type].timestamp)) {
        delete updatedCache[type];
        hasRemovedEntries = true;
      }
    }

    if (hasRemovedEntries) {
      setPlaceCache(updatedCache);
    }
  }, [placeCache]);

  // Run cache cleanup periodically
  useEffect(() => {
    cleanupCache();
    const intervalId = setInterval(cleanupCache, CACHE_EXPIRY_TIME / 24); // Check cache ~ every hour
    return () => clearInterval(intervalId);
  }, [cleanupCache]);

  const updateMarkers = useCallback(async () => {
    setIsLoading(true);
    let newMarkers: MarkerData[] = [...defaultMarkers];
    const typesToFetch: string[] = [];

    // First, check which types we need to fetch
    for (const type of confirmedTypes) {
      if (type.toLowerCase() === 'favoritos') {
        continue; // Skip favoritos, we'll handle these separately
      }
      
      // Check if we have valid cached data
      if (
        placeCache[type] && 
        placeCache[type].markers.length > 0 && 
        !isCacheExpired(placeCache[type].timestamp)
      ) {
        newMarkers = [...newMarkers, ...placeCache[type].markers];
      } else {
        typesToFetch.push(type);
      }
    }
    
    // Fetch any missing types
    if (typesToFetch.length > 0) {
      for (const type of typesToFetch) {
        try {
          console.log(`Fetching places for: ${type}`);
          const results = await placesService.fetchPlaces({
            latitude: CENTER.latitude,
            longitude: CENTER.longitude,
            query: type,
          });
          
          if (!results || results.length === 0) {
            console.log(`No results found for: ${type}`);
            continue;
          }
          
          const typeMarkers: MarkerData[] = results
            .filter((place: any) => place && place.geometry)
            .map((place: any) => {
              const { lat, lng } = place.geometry.location;
              const markerId = place.place_id || `manual_${lat}_${lng}`;
  
              // Define pin color based on category
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
              };
            });
          
          // Store in cache with timestamp
          setPlaceCache(prev => ({
            ...prev,
            [type]: { 
              markers: typeMarkers,
              timestamp: Date.now()
            }
          }));
          
          // Add to current markers
          newMarkers = [...newMarkers, ...typeMarkers];
        } catch (error) {
          console.error(`Error fetching places for ${type}:`, error);
          Alert.alert(
            'Error', 
            `No se pudieron obtener lugares para: ${type}. Inténtalo de nuevo.`
          );
        }
      }
    }
    
    setMarkers(newMarkers);
    setIsLoading(false);
  }, [confirmedTypes, defaultMarkers, placeCache, placesService, CENTER]);

  // Only update markers when confirmedTypes changes
  useEffect(() => {
    if (confirmedTypes.length > 0) {
      updateMarkers();
    } else {
      setMarkers(defaultMarkers);
    }
  }, [confirmedTypes, updateMarkers, defaultMarkers]);

  const handleApplyFilters = () => {
    setConfirmedTypes([...pendingTypes]); // Create new array to ensure change detection
    setHasChanges(false);
  };

  const toggleTypeSelection = (type: string) => {
    setPendingTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } 
      return [...prev, type];
    });
    setHasChanges(true);
  };

  const isFavoriteMarker = useCallback((id: string) => {
    return favoriteMarkers.some((m) => m.id === id);
  }, [favoriteMarkers]);

  const toggleFavorite = (marker: MarkerData) => {
    if (isFavoriteMarker(marker.id)) {
      setFavoriteMarkers((prev) => prev.filter((m) => m.id !== marker.id));
    } else {
      const favoriteMarker = { 
        ...marker, 
        category: 'favoritos', 
        pinColor: '#bb86fc',
        timestamp: Date.now()
      };
      setFavoriteMarkers((prev) => [...prev, favoriteMarker]);
      
      // Optional: Save favorites to persistent storage
      // saveFavoriteMarkers([...favoriteMarkers, favoriteMarker]);
    }
  };

  // Calculate markers to show - memoize this for performance
  const markersToShow = React.useMemo(() => {
    if (confirmedTypes.includes('favoritos')) {
      // Return both regular markers and favorites (avoiding duplicates)
      const markerIds = new Set(markers.map(m => m.id));
      const uniqueFavorites = favoriteMarkers.filter(m => !markerIds.has(m.id));
      return [...markers, ...uniqueFavorites];
    }
    return markers;
  }, [markers, favoriteMarkers, confirmedTypes]);

  const handleLongPress = (e: any) => {
    if (!isAddingPlace) return;
    setManualMarkerCoords(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  const handleAddManualMarker = () => {
    if (!manualMarkerCoords || !manualMarkerName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el marcador.');
      return;
    }
    const newMarker: MarkerData = {
      id: `manual_${Date.now()}`,
      coordinate: manualMarkerCoords,
      name: manualMarkerName.trim(),
      address: 'Lugar agregado manualmente',
      category: 'favoritos',
      pinColor: '#bb86fc',
    };
    setFavoriteMarkers((prev) => [...prev, newMarker]);
    setMarkers((prev) => [...prev, newMarker]);
    setManualMarkerName('');
    setManualMarkerCoords(null);
    setModalVisible(false);
    setIsAddingPlace(false);
  };

  const toggleAddingPlace = () => {
    setIsAddingPlace(!isAddingPlace);
    // If we're turning off adding place mode, reset the marker coords and name
    if (isAddingPlace) {
      setManualMarkerCoords(null);
      setManualMarkerName('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScrollView
          horizontal
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
          showsHorizontalScrollIndicator={false}
        >
          {availablePlaceTypes.map((type) => {
            const selected = pendingTypes.includes(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleTypeSelection(type)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {hasChanges && (
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleApplyFilters}
            disabled={isLoading}
          >
            <Text style={styles.confirmButtonText}>
              {isLoading ? 'Buscando...' : 'Aplicar Filtros'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: CENTER.latitude,
            longitude: CENTER.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onLongPress={handleLongPress}
        >
          {markersToShow.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.name}
              description={marker.address}
              pinColor={marker.pinColor || '#6200ee'}
              onCalloutPress={() => {
                Alert.alert(
                  marker.name,
                  isFavoriteMarker(marker.id) 
                    ? '¿Quitar de favoritos?' 
                    : '¿Agregar a favoritos?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: isFavoriteMarker(marker.id) ? 'Quitar' : 'Agregar',
                      onPress: () => toggleFavorite(marker),
                    },
                  ]
                );
              }}
            />
          ))}
        </MapView>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#bb86fc" />
            <Text style={styles.loadingText}>Buscando lugares...</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.addButton, 
          isAddingPlace && styles.addButtonActive
        ]} 
        onPress={toggleAddingPlace}
      >
        <Text 
          style={[
            styles.addButtonText,
            isAddingPlace && styles.addButtonTextActive
          ]}
        >
          {isAddingPlace ? 'Cancelar' : 'Agregar Lugar'}
        </Text>
      </TouchableOpacity>
      
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nombre del Lugar</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Mi Lugar"
              placeholderTextColor="#888"
              value={manualMarkerName}
              onChangeText={setManualMarkerName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setIsAddingPlace(false);
                  setManualMarkerCoords(null);
                  setManualMarkerName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddManualMarker}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { 
    backgroundColor: '#1e1e1e', 
    paddingVertical: 10, 
    elevation: 2,
    paddingBottom: 16,
  },
  chipsContainer: { flexGrow: 1 },
  chipsContent: { paddingHorizontal: 16 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#222',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  chipSelected: {
    backgroundColor: '#bb86fc',
    borderColor: '#bb86fc',
  },
  chipText: { color: '#fff', fontSize: 14 },
  chipTextSelected: { color: '#121212', fontWeight: 'bold' },
  confirmButton: {
    backgroundColor: '#FF4081',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginTop: 10,
    alignSelf: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: [{ translateX: -110 }],
    backgroundColor: '#bb86fc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: 220,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonActive: {
    backgroundColor: '#FF4081', // Brighter pink color when active
  },
  addButtonText: { 
    color: '#121212', 
    fontWeight: 'bold' 
  },
  addButtonTextActive: {
    color: '#FFFFFF', // White text for better contrast on pink
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    width: '85%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#fff',
    backgroundColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#333',
  },
  modalButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  agregarButton: {
    backgroundColor: '#bb86fc',
  },
  agregarButtonActive: {
    backgroundColor: '#FF4081', // Brighter pink color when active
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
