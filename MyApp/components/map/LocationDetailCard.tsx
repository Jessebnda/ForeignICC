import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapLocation } from '../../services/locationService';

interface LocationDetailCardProps {
  location: MapLocation;
  onClose: () => void;
  onDelete?: (locationId: string) => void;
  isCreator?: boolean;
}

export default function LocationDetailCard({
  location,
  onClose,
  onDelete,
  isCreator = false
}: LocationDetailCardProps) {
  // Obtener ícono según el tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'university':
        return 'school';
      case 'restaurant':
        return 'restaurant';
      case 'housing':
        return 'home';
      case 'entertainment':
        return 'film';
      case 'transport':
        return 'bus';
      default:
        return 'location';
    }
  };
  
  // Formatear tipo para mostrar
  const formatType = (type: string) => {
    switch (type) {
      case 'university':
        return 'Universidad';
      case 'restaurant':
        return 'Restaurante';
      case 'housing':
        return 'Alojamiento';
      case 'entertainment':
        return 'Entretenimiento';
      case 'transport':
        return 'Transporte';
      default:
        return 'Otro';
    }
  };
  
  const handleDelete = () => {
    if (location.id && onDelete) {
      onDelete(location.id);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{location.title}</Text>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {location.imageUrl && (
          <Image 
            source={{ uri: location.imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
        )}
        
        <View style={styles.infoContainer}>
          {location.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#bb86fc" />
              <Text style={styles.infoText}>{location.address}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Ionicons name={getTypeIcon(location.type)} size={18} color="#bb86fc" />
            <Text style={styles.infoText}>{formatType(location.type)}</Text>
          </View>
          
          {location.rating && (
            <View style={styles.infoRow}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.infoText}>{location.rating.toFixed(1)} / 5.0</Text>
            </View>
          )}
          
          {location.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Descripción</Text>
              <Text style={styles.description}>{location.description}</Text>
            </View>
          )}
          
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesTitle}>Coordenadas</Text>
            <Text style={styles.coordinates}>
              Lat: {location.coordinates.latitude.toFixed(6)}, Lng: {location.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        {isCreator && onDelete && location.id && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.directionsButton}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.directionsButtonText}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
  },
  infoContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  descriptionContainer: {
    marginVertical: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 22,
  },
  coordinatesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#888',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cf6679',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  directionsButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});