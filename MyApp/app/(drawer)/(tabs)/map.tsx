// MapScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet,
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
import { firestore } from '../../../firebase';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { GeoPoint } from 'firebase/firestore';



const availablePlaceTypes = ['gym', 'store', 'bar', 'restaurant', 'favoritos'];

export default function MapScreen() {
  // Estados para filtros y marcadores (funcionalidad original)
  const [pendingTypes, setPendingTypes] = useState<string[]>([]);
  const [confirmedTypes, setConfirmedTypes] = useState<string[]>([]);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualMarkerCoords, setManualMarkerCoords] = useState<LatLng | null>(null);
  const [manualMarkerName, setManualMarkerName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);

  //auth y amigos
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (user) {
      setCurrentUserId(user.uid);
  
      // Cargar amigos
      const loadFriends = async () => {
        const userRef = doc(firestore, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFriendIds(data.friends || []);
        }
      };
  
      loadFriends();
    }
  }, []);

  //fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'mapLocations'));
        const loadedLocations = querySnapshot.docs
          .map((doc) => doc.data())
          .filter((loc) => 
            loc.createdBy === currentUserId || friendIds.includes(loc.createdBy)
          )
          .map((loc) => ({
            id: loc.locationId,
            title: loc.title,
            description: loc.description,
            geoPoint: {
              latitude: loc.geoPoint.latitude,
              longitude: loc.geoPoint.longitude,
            },
            type: loc.type,
            imageUrl: loc.imageUrl,
            createdBy: loc.createdBy,
          }));
        setLocations(loadedLocations);
      } catch (error) {
        console.error('❌ Error cargando lugares:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (currentUserId) {
      fetchLocations();
    }
  }, [currentUserId, friendIds]);

  //nuevo lugar
  const handleLongPress = (e: any) => {
    if (!isAddingPlace) return;
    setManualMarkerCoords(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  //marcador
  const handleAddManualMarker = async () => {
    if (!manualMarkerCoords || !manualMarkerName.trim() || !currentUserId) {
      Alert.alert('Error', 'Completa los datos.');
      return;
    }
  
    const newId = Date.now().toString();
  
    const newMarker = {
      locationId: newId,
      title: manualMarkerName.trim(),
      description: 'Lugar agregado manualmente',
      geoPoint: new GeoPoint(
        manualMarkerCoords.latitude,
        manualMarkerCoords.longitude
      ),
      type: ['favoritos'],
      imageUrl: '', // podrías agregar luego
      createdBy: currentUserId,
      createdAt: new Date(),
      rating: [],
    };
  
    try {
      await setDoc(doc(firestore, 'mapLocations', newId), newMarker);
      Alert.alert('✅ Lugar guardado en Firestore');
  
      // Refrescar lugares
      setManualMarkerName('');
      setManualMarkerCoords(null);
      setModalVisible(false);
      setIsAddingPlace(false);
  
      // Vuelve a cargar
      const refreshed = await getDocs(collection(firestore, 'mapLocations'));
      const loadedLocations = refreshed.docs
        .map((doc) => doc.data())
        .filter((loc) => loc.createdBy === currentUserId || friendIds.includes(loc.createdBy))
        .map((loc) => ({
          id: loc.locationId,
          title: loc.title,
          description: loc.description,
          geoPoint: {
            latitude: loc.geoPoint.latitude,
            longitude: loc.geoPoint.longitude,
          },
          type: loc.type,
          imageUrl: loc.imageUrl,
          createdBy: loc.createdBy,
        }));
      setLocations(loadedLocations);
    } catch (error) {
      console.error('❌ Error guardando lugar:', error);
    }
  };
  
  
  
  
  // Ubicación del usuario
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Funcionalidad "Pedir Raite"
  const [isRaiteActive, setIsRaiteActive] = useState(false);
  const [selectedRaitePlace, setSelectedRaitePlace] = useState<LatLng | null>(null);
  const [raiteConfirmModalVisible, setRaisteConfirmModalVisible] = useState(false);
  const [friendSelectionModalVisible, setFriendSelectionModalVisible] = useState(false);
  type Friend = { id: string; name: string; };
  const [dummyFriends] = useState<Friend[]>([
    { id: '1', name: 'Amigo 1' },
    { id: '2', name: 'Amigo 2' },
  ]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const CENTER: LatLng = { latitude: 32.6245, longitude: -115.4523 };

  // Solicitar permisos y obtener la ubicación real con Expo Location
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

  // Inicializa pendingTypes al montar (o podrías cargar desde almacenamiento)
  useEffect(() => {
    setPendingTypes(confirmedTypes);
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'mapLocations'));
        const loadedLocations = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: data.locationId,
            title: data.title,
            description: data.description,
            geoPoint: {
              latitude: data.geoPoint.latitude,
              longitude: data.geoPoint.longitude,
            },
            type: data.type,
            imageUrl: data.imageUrl,
          };
        });
        setLocations(loadedLocations);
      } catch (error) {
        console.error('❌ Error al cargar lugares:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchLocations();
  }, []);



  const handleApplyFilters = () => {
    setConfirmedTypes([...pendingTypes]);
    setHasChanges(false);
  };

  const toggleTypeSelection = (type: string) => {
    setPendingTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    setHasChanges(true);
  };

  /*const isFavoriteMarker = useCallback((id: string) => {
    return favoriteMarkers.some(m => m.id === id);
  }, [favoriteMarkers]);*/

  /*const toggleFavorite = (marker: MarkerData) => {
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
  };*/

  /*const handleAddManualMarker = () => {
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
      timestamp: Date.now(),
    };
    setFavoriteMarkers(prev => [...prev, newMarker]);
    setManualMarkerName('');
    setManualMarkerCoords(null);
    setModalVisible(false);
    setIsAddingPlace(false);
  };*/

  const toggleAddingPlace = () => {
    setIsAddingPlace(prev => !prev);
    if (isAddingPlace) {
      setManualMarkerCoords(null);
      setManualMarkerName('');
    }
  };

  // Funciones para "Pedir Raite"
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

  const filteredLocations = locations.filter((place) => {
    if (confirmedTypes.length === 0) return true;
    return place.type.some((t: string) => confirmedTypes.includes(t));
  });
  

  // ─── CONDICIONAL PARA CARGAR EL MAPA ─────────────────────────────
  // Si no se ha obtenido la ubicación (o aún se está cargando), mostramos un indicador.
  if (!userLocation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando ubicación...</Text>
      </SafeAreaView>
    );
  }
  // ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con filtros */}
      <View style={styles.header}>
        <ScrollView horizontal style={styles.chipsContainer} contentContainerStyle={styles.chipsContent} showsHorizontalScrollIndicator={false}>
          {availablePlaceTypes.map(type => {
            const selected = pendingTypes.includes(type);
            return (
              <TouchableOpacity key={type} style={[styles.chip, selected && styles.chipSelected]} onPress={() => toggleTypeSelection(type)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{type.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {hasChanges && (
          <TouchableOpacity style={styles.confirmButton} onPress={handleApplyFilters} disabled={isLoading}>
            <Text style={styles.confirmButtonText}>{isLoading ? 'Buscando...' : 'Aplicar Filtros'}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onLongPress={handleLongPress}
          onPress={isRaiteActive ? handleMapPress : undefined}
        >
          {userLocation && <Marker coordinate={userLocation} title="Tú" />}
          {filteredLocations.map((place) => (
        <Marker
          key={place.locationId}
          coordinate={place.geoPoint}
          title={place.title}
          description={place.description}
          pinColor="#4f0c2e"
        />
      ))}

          {isRaiteActive && selectedRaitePlace && (
            <Marker coordinate={selectedRaitePlace} pinColor="orange" title="Lugar para Raite" />
          )}
        </MapView>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#bb86fc" />
            <Text style={styles.loadingText}>Buscando lugares...</Text>
          </View>
        )}
      </View>
      
      {/* Botón para agregar marcador manual */}
      <TouchableOpacity style={styles.addButton} onPress={toggleAddingPlace}>
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
      
      {/* Modal para confirmar "Pedir Raite" */}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 16, fontWeight: 'bold' },
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
