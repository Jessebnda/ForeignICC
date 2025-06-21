import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapLocation } from '../../services/locationService';

interface LocationCalloutProps {
  location: MapLocation;
}

export default function LocationCallout({ location }: LocationCalloutProps) {
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
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{location.title}</Text>
      
      {location.address && (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color="#555" />
          <Text style={styles.address}>{location.address}</Text>
        </View>
      )}
      
      <View style={styles.row}>
        <Ionicons name={getTypeIcon(location.type)} size={14} color="#555" />
        <Text style={styles.type}>{formatType(location.type)}</Text>
      </View>
      
      {location.rating && (
        <View style={styles.row}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{location.rating.toFixed(1)}</Text>
        </View>
      )}
      
      {location.description && (
        <Text style={styles.description} numberOfLines={2}>
          {location.description}
        </Text>
      )}
      
      {location.imageUrl && (
        <Image 
          source={{ uri: location.imageUrl }} 
          style={styles.image} 
          resizeMode="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
    flex: 1,
  },
  type: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
  rating: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
  description: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 4,
    marginTop: 8,
  },
});