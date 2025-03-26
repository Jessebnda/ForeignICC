import React, { useState, useEffect, useCallback } from 'react';
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
import * as Location from 'expo-location';
import { GooglePlacesService } from '../services/googlePlacesService';

type MarkerData = {
  id: string;
  coordinate: LatLng;
  name: string;
  address?: string;
  category?: string;
  pinColor?: string;
  timestamp?: number; // Para expiración de caché
};

type CacheData = {
  markers: MarkerData[];
  timestamp: number;
};

const availablePlaceTypes = ['gym', 'store', 'bar', 'restaurant', 'favoritos'];
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas

export default function MapScreen() {
  // Estados originales de tus marcadores y filtros
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

  // Estado para la ubicación real del usuario
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Estado para "Pedir Raite"
  const [isRaiteActive, setIsRaiteActive] = useState(false);
  const [selectedRaitePlace, setSelectedRaitePlace] = useState<LatLng | null>(null);
  const [raiteConfirmModalVisible, setRaisteConfirmModalVisible] = useState(false);
  const [friendSelectionModalVisible, setFriendSelectionModalVisible] = useState(false);
  type Friend = { id: string; name: string; };
  const [dummyFriends, setDummyFriends] = useState<Friend[]>([
    { id: '1', name: 'Amigo 1' },
    { id: '2', name: 'Amigo 2' },
  ]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Centro por defecto (se usa si no se obtiene la ubicación)
  const CENTER: LatLng = { latitude: 32.6245, longitude: -115.4523 };

  // Inicializar el servicio de Google Places
  const placesService = new GooglePlacesService({ apiKey: 'APIKEY' });

  // Al montar, se inicializan los pendingTypes y se pueden cargar favoritos
  useEffect(() => {
    setPendingTypes(confirmedTypes);
    // loadFavoriteMarkers(); // Si los tienes en almacenamiento
  }, []);

  // Solicitar permisos y obtener la ubicación real del usuario con Expo Location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se pudo acceder a la ubicación del dispositivo.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Funciones para caché de lugares
  const isCacheExpired = (timestamp: number) => {
    return Date.now() - timestamp > CACHE_EXPIRY_TIME;
  };

  const cleanupCache = useCallback(() => {
    // Only update if something actually changed
    setPlaceCache(prevCache => {
      const updatedCache = { ...prevCache };
      let hasRemovedEntries = false;
      
      for (const type in updatedCache) {
        if (isCacheExpired(updatedCache[type].timestamp)) {
          delete updatedCache[type];
          hasRemovedEntries = true;
        }
      }
      
      // Only return new object if something changed
      return hasRemovedEntries ? updatedCache : prevCache;
    });
  }, []); // Remove placeCache dependency

  useEffect(() => {
    cleanupCache();
    const intervalId = setInterval(cleanupCache, CACHE_EXPIRY_TIME / 24);
    return () => clearInterval(intervalId);
  }, [cleanupCache]);

  const updateMarkers = useCallback(async () => {
    setIsLoading(true);
    let newMarkers: MarkerData[] = [];
    const typesToFetch: string[] = [];
    
    // Get current confirmedTypes and placeCache from within the callback
    // instead of from the dependency array
    const currentConfirmedTypes = confirmedTypes;
    
    // Use a function to access the latest placeCache state
    setPlaceCache(currentCache => {
      // Verify which types need to be fetched based on current cache
      for (const type of currentConfirmedTypes) {
        if (type.toLowerCase() === 'favoritos') continue;
        if (
          currentCache[type] && 
          currentCache[type].markers.length > 0 && 
          !isCacheExpired(currentCache[type].timestamp)
        ) {
          newMarkers = [...newMarkers, ...currentCache[type].markers];
        } else {
          typesToFetch.push(type);
        }
      }
      
      // Return the same cache for now - we'll update it later if needed
      return currentCache;
    });
    
    if (typesToFetch.length > 0) {
      const currentLocation = userLocation || CENTER;
      
      for (const type of typesToFetch) {
        try {
          console.log(`Fetching places for: ${type}`);
          const results = await placesService.fetchPlaces({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            query: type,
          });
          
          if (!results || results.length === 0) continue;
          
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
              };
            });
          
          // Update the cache for this specific type only
          setPlaceCache(prevCache => ({
            ...prevCache,
            [type]: { 
              markers: typeMarkers,
              timestamp: Date.now()
            }
          }));
          
          newMarkers = [...newMarkers, ...typeMarkers];
        } catch (error) {
          console.error(`Error fetching places for ${type}:`, error);
        }
      }
    }
    
    setMarkers(newMarkers);
    setIsLoading(false);
  }, [userLocation, placesService]); // Remove confirmedTypes and placeCache

  useEffect(() => {
    if (confirmedTypes.length > 0) {
      // Use a timeout to break the immediate cycle
      const timer = setTimeout(() => {
        updateMarkers();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setMarkers([]);
    }
  }, [confirmedTypes, updateMarkers]);

  const handleApplyFilters = () => {
    setConfirmedTypes([...pendingTypes]);
    setHasChanges(false);
  };

  const toggleTypeSelection = (type: string) => {
    setPendingTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    setHasChanges(true);
  };

  const isFavoriteMarker = useCallback((id: string) => {
    return favoriteMarkers.some(m => m.id === id);
  }, [favoriteMarkers]);

  const toggleFavorite = (marker: MarkerData) => {
    if (isFavoriteMarker(marker.id)) {
      setFavoriteMarkers(prev => prev.filter(m => m.id !== marker.id));
    } else {
      const favoriteMarker = { 
        ...marker, 
        category: 'favoritos', 
        pinColor: '#bb86fc',
        timestamp: Date.now()
      };
      setFavoriteMarkers(prev => [...prev, favoriteMarker]);
    }
  };

  const markersToShow = React.useMemo(() => {
    if (confirmedTypes.includes('favoritos')) {
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
    setFavoriteMarkers(prev => [...prev, newMarker]);
    setMarkers(prev => [...prev, newMarker]);
    setManualMarkerName('');
    setManualMarkerCoords(null);
    setModalVisible(false);
    setIsAddingPlace(false);
  };

  const toggleAddingPlace = () => {
    setIsAddingPlace(!isAddingPlace);
    if (isAddingPlace) {
      setManualMarkerCoords(null);
      setManualMarkerName('');
    }
  };

  // Funciones para la funcionalidad "Pedir Raite"
  const handleMapPress = (e: any) => {
    const coordinate: LatLng = e.nativeEvent.coordinate;
    if (isRaiteActive) {
      setSelectedRaitePlace(coordinate);
      setRaisteConfirmModalVisible(true);
    }
  };

  const confirmRaiteRequest = () => {
    setRaisteConfirmModalVisible(false);
    setFriendSelectionModalVisible(true);
  };

  const cancelRaiteRequest = () => {
    setRaisteConfirmModalVisible(false);
    setSelectedRaitePlace(null);
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]);
  };

  const sendRaiteRequest = () => {
    Alert.alert('Solicitud Enviada', `Se ha enviado la solicitud de raite a: ${selectedFriends.join(', ')}`);
    setFriendSelectionModalVisible(false);
    setSelectedRaitePlace(null);
    setSelectedFriends([]);
    setIsRaiteActive(false);
  };

  const toggleRaiteMode = () => {
    setIsRaiteActive(prev => !prev);
    if (isRaiteActive) {
      setSelectedRaitePlace(null);
      setRaisteConfirmModalVisible(false);
      setFriendSelectionModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScrollView horizontal style={styles.chipsContainer} contentContainerStyle={styles.chipsContent} showsHorizontalScrollIndicator={false}>
          {availablePlaceTypes.map(type => {
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
          // Se centra el mapa en la ubicación real si está disponible; en caso contrario se usa CENTER
          initialRegion={{
            latitude: userLocation ? userLocation.latitude : CENTER.latitude,
            longitude: userLocation ? userLocation.longitude : CENTER.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onLongPress={handleLongPress}
          // Si el modo raite está activo, usamos onPress para capturar la selección del lugar
          onPress={isRaiteActive ? handleMapPress : undefined}
        >
          {/* Ubicación del usuario: marcador y círculo */}
          {userLocation && (
            <>
              <Marker coordinate={userLocation} title="Tú" />
            </>
          )}
          
          {/* Se muestran los marcadores obtenidos */}
          {markersToShow.map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.name}
              description={marker.address}
              pinColor={marker.pinColor || '#6200ee'}
              onCalloutPress={() => {
                Alert.alert(
                  marker.name,
                  isFavoriteMarker(marker.id) ? '¿Quitar de favoritos?' : '¿Agregar a favoritos?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: isFavoriteMarker(marker.id) ? 'Quitar' : 'Agregar', 
                      onPress: () => toggleFavorite(marker) 
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
      
      {/* Botón para agregar marcador manual (funcionalidad original) */}
      <TouchableOpacity style={[styles.addButton]} onPress={toggleAddingPlace}>
        <Text style={styles.addButtonText}>{isAddingPlace ? 'Cancelar' : 'Agregar Lugar'}</Text>
      </TouchableOpacity>
      
      {/* Botón para "Pedir Raite" */}
      <TouchableOpacity style={styles.raiteButton} onPress={toggleRaiteMode}>
        <Text style={styles.raiteButtonText}>{isRaiteActive ? 'Cancelar Pedir Raite' : 'Pedir Raite'}</Text>
      </TouchableOpacity>
      
      {/* Modal para agregar marcador manual */}
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
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => {
                setModalVisible(false);
                setIsAddingPlace(false);
                setManualMarkerCoords(null);
                setManualMarkerName('');
              }}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddManualMarker}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal de confirmación para "Pedir Raite" */}
      <Modal visible={raiteConfirmModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar Raite</Text>
            <Text style={styles.modalMessage}>¿Seguro que quieres pedir raite a este lugar?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={cancelRaiteRequest}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={confirmRaiteRequest}>
                <Text style={styles.modalButtonText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para seleccionar amigos */}
      <Modal visible={friendSelectionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona amigos</Text>
            <ScrollView style={styles.friendsList}>
              {dummyFriends.map(friend => (
                <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => toggleFriendSelection(friend.id)}>
                  <Text style={styles.friendText}>{friend.name}</Text>
                  {selectedFriends.includes(friend.id) && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setFriendSelectionModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={sendRaiteRequest}>
                <Text style={styles.modalButtonText}>Enviar Solicitud</Text>
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
  header: { backgroundColor: '#1e1e1e', paddingVertical: 10, paddingBottom: 16 },
  chipsContainer: {},
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
  chipSelected: { backgroundColor: '#bb86fc', borderColor: '#bb86fc' },
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
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#bb86fc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: { color: '#121212', fontWeight: 'bold' },
  raiteButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#FF4081',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  raiteButtonText: { color: '#fff', fontWeight: 'bold' },
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
  loadingText: { color: '#fff', marginTop: 10, fontSize: 16, fontWeight: 'bold' },
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
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
    textAlign: 'center',
  },
  modalMessage: { color: '#fff', marginBottom: 20, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#fff',
    backgroundColor: '#333',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  modalButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: { backgroundColor: '#333' },
  modalButtonText: { color: '#121212', fontWeight: 'bold' },
  friendsList: { maxHeight: 200, marginBottom: 16 },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 10,
  },
  friendText: { color: '#fff', fontSize: 16 },
  checkMark: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold' },
});
