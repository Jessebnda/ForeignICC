import React from 'react';
import { StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { MapLocation } from '../../services/locationService';
import LocationCallout from './LocationCallout';

interface LocationMarkerProps {
  location: MapLocation;
  onPress: (location: MapLocation) => void;
}

export default function LocationMarker({ location, onPress }: LocationMarkerProps) {
  // Determinar el ícono según el tipo de ubicación
  const getMarkerIcon = (type: string) => {
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
  
  // Determinar el color según el tipo de ubicación
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'university':
        return '#4285F4'; // Azul
      case 'restaurant':
        return '#EA4335'; // Rojo
      case 'housing':
        return '#34A853'; // Verde
      case 'entertainment':
        return '#FBBC05'; // Amarillo
      case 'transport':
        return '#7B1FA2'; // Morado
      default:
        return '#757575'; // Gris
    }
  };
  
  return (
    <Marker
      coordinate={location.coordinates}
      onPress={() => onPress(location)}
      pinColor={getMarkerColor(location.type)}
    >
      <Callout>
        <LocationCallout location={location} />
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  // No necesitamos estilos aquí ya que react-native-maps maneja la apariencia
});