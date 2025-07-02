import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapLocation } from '../../services/locationService';

interface LocationDetailCardProps {
  location: MapLocation;
  onClose: () => void;
  onDelete?: (locationId: string) => void;
  isCreator?: boolean;
}

const LOCATION_TYPES = {
  university: { label: 'Universidad', icon: 'school-outline', color: '#4CAF50' },
  restaurant: { label: 'Restaurante', icon: 'restaurant-outline', color: '#FF9800' },
  housing: { label: 'Alojamiento', icon: 'home-outline', color: '#2196F3' },
  entertainment: { label: 'Entretenimiento', icon: 'game-controller-outline', color: '#E91E63' },
  transport: { label: 'Transporte', icon: 'bus-outline', color: '#9C27B0' },
  other: { label: 'Otro', icon: 'ellipsis-horizontal-outline', color: '#607D8B' },
};

export default function LocationDetailCard({
  location,
  onClose,
  onDelete,
  isCreator = false
}: LocationDetailCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const typeInfo = LOCATION_TYPES[location.type as keyof typeof LOCATION_TYPES] || LOCATION_TYPES.other;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar ubicación',
      '¿Estás seguro de que quieres eliminar esta ubicación? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            if (location.id && onDelete) {
              onDelete(location.id);
            }
          },
        },
      ]
    );
  };

  const handleDirections = () => {
    const { latitude, longitude } = location.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir la aplicación de mapas');
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.typeIconContainer, { backgroundColor: typeInfo.color }]}>
            <Ionicons name={typeInfo.icon as any} size={20} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>{location.title}</Text>
            <Text style={styles.typeLabel}>{typeInfo.label}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Imagen con overlay de información */}
        {location.imageUrl && !imageError && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: location.imageUrl }} 
              style={styles.image} 
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            <View style={styles.imageOverlay}>
              <View style={styles.imageInfo}>
                {location.rating && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{location.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Información principal */}
        <View style={styles.mainInfo}>
          {/* Dirección */}
          {location.address && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location" size={18} color="#bb86fc" />
                </View>
                <Text style={styles.infoTitle}>Dirección</Text>
              </View>
              <Text style={styles.infoText}>{location.address}</Text>
            </View>
          )}

          {/* Descripción */}
          {location.description && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="document-text-outline" size={18} color="#bb86fc" />
                </View>
                <Text style={styles.infoTitle}>Descripción</Text>
              </View>
              <Text style={styles.descriptionText}>{location.description}</Text>
            </View>
          )}

          {/* Información adicional */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#888" />
                <Text style={styles.infoLabel}>Agregado</Text>
                <Text style={styles.infoValue}>
                  {location.createdAt ? formatDate(location.createdAt) : 'Fecha no disponible'}
                </Text>
              </View>
            </View>

            {/* Coordenadas */}
            <View style={styles.coordinatesCard}>
              <View style={styles.coordinatesHeader}>
                <Ionicons name="navigate-outline" size={16} color="#bb86fc" />
                <Text style={styles.coordinatesTitle}>Coordenadas GPS</Text>
              </View>
              <View style={styles.coordinatesContent}>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Latitud:</Text>
                  <Text style={styles.coordinateValue}>
                    {location.coordinates.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Longitud:</Text>
                  <Text style={styles.coordinateValue}>
                    {location.coordinates.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer con acciones mejoradas */}
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          {isCreator && onDelete && location.id && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.directionsButton, isCreator && styles.directionsButtonFull]}
            onPress={handleDirections}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.directionsButtonText}>Cómo llegar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    width: '100%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: 13,
    color: '#888',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#333',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  imageInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mainInfo: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(187, 134, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#bb86fc',
  },
  infoText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 22,
  },
  additionalInfo: {
    gap: 15,
  },
  infoRow: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  coordinatesCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
  },
  coordinatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#bb86fc',
    marginLeft: 8,
  },
  coordinatesContent: {
    gap: 8,
  },
  coordinateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 13,
    color: '#888',
  },
  coordinateValue: {
    fontSize: 13,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  footerActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  directionsButtonFull: {
    flex: 1,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});