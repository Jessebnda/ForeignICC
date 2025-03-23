import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import MapView, { Marker, LatLng } from 'react-native-maps';
import { GooglePlacesService } from '../services/googlePlacesService'; // Asegúrate de tener este servicio implementado

type MarkerData = {
  id: string;
  coordinate: LatLng;
  name: string;
  address?: string;
  category?: string;
  pinColor?: string; // Agregamos la propiedad pinColor para cada marcador
};

const availablePlaceTypes = ['gym', 'store', 'bar', 'restaurant', 'favoritos'];

export default function MapScreen() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [favoriteMarkers, setFavoriteMarkers] = useState<MarkerData[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualMarkerCoords, setManualMarkerCoords] = useState<LatLng | null>(null);
  const [manualMarkerName, setManualMarkerName] = useState('');

  const CENTER: LatLng = { latitude: 32.6245, longitude: -115.4523 };

  const defaultMarkers: MarkerData[] = [
    {
      id: 'default1',
      coordinate: { latitude: 32.6280, longitude: -115.4550 },
      name: 'Lugar de Interés',
      address: 'Información general',
      pinColor: '#6200ee', // color por defecto (morado)
    },
  ];

  // Instancia del servicio de Google Places (usa tu propia API key)
  const placesService = new GooglePlacesService({ apiKey: 'APIKEY' });

  useEffect(() => {
    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes]);

  const updateMarkers = async () => {
    const newMarkers: MarkerData[] = [...defaultMarkers];

    // Llama a la API para cada categoría seleccionada, excepto "favoritos"
    for (const type of selectedTypes) {
      if (type.toLowerCase() !== 'favoritos') {
        const results = await placesService.fetchPlaces({
          latitude: CENTER.latitude,
          longitude: CENTER.longitude,
          query: type,
        });
        results.forEach((place: any) => {
          const geometry = place.geometry;
          if (!geometry) return;
          const { lat, lng } = geometry.location;
          const markerId = place.place_id || `manual_${lat}_${lng}`;

          // Define el color del pin según la categoría
          let pinColor = '#FF0000'; // rojo por defecto
          switch (type) {
            case 'gym':
              pinColor = '#9C27B0'; // morado
              break;
            case 'store':
              pinColor = '#2196F3'; // azul
              break;
            case 'bar':
              pinColor = '#FF9800'; // naranja
              break;
            case 'restaurant':
              pinColor = '#4CAF50'; // verde
              break;
          }

          newMarkers.push({
            id: markerId,
            coordinate: { latitude: lat, longitude: lng },
            name: place.name,
            address: place.formatted_address,
            category: type,
            pinColor,
          });
        });
      }
    }
    setMarkers(newMarkers);
  };

  const isFavoriteMarker = (id: string) => favoriteMarkers.some((m) => m.id === id);

  const toggleFavorite = (marker: MarkerData) => {
    if (isFavoriteMarker(marker.id)) {
      setFavoriteMarkers((prev) => prev.filter((m) => m.id !== marker.id));
    } else {
      setFavoriteMarkers((prev) => [
        ...prev,
        { ...marker, category: 'favoritos', pinColor: '#bb86fc' }, // favorito con color lila
      ]);
    }
  };

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

  const markersToShow: MarkerData[] = selectedTypes.includes('favoritos') ? favoriteMarkers : markers;

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
            const selected = selectedTypes.includes(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => {
                  if (selected) {
                    setSelectedTypes((prev) => prev.filter((t) => t !== type));
                  } else {
                    setSelectedTypes((prev) => [...prev, type]);
                  }
                }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
                  isFavoriteMarker(marker.id) ? '¿Quitar de favoritos?' : '¿Agregar a favoritos?',
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
  header: { backgroundColor: '#1e1e1e', paddingVertical: 10, elevation: 2 },
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
});
