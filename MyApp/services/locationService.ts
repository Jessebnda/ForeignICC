import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  GeoPoint,
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from './firebase/config';
import * as Location from 'expo-location';

// Interfaces
export interface MapLocation {
  id?: string;
  title: string;
  description?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'university' | 'restaurant' | 'housing' | 'entertainment' | 'transport' | 'other';
  address?: string;
  rating?: number;
  imageUrl?: string;
  createdBy?: string;
  createdAt?: any;
}

export interface UserLocation {
  id?: string;
  userId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: any;
}

// Obtener la ubicación actual del usuario
export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Permiso para acceder a la ubicación denegado');
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return location;
  } catch (error) {
    console.error('Error obteniendo ubicación actual:', error);
    return null;
  }
};

// Guardar la ubicación actual del usuario en Firestore
export const saveUserLocation = async (
  userId: string, 
  coordinates: { latitude: number; longitude: number }
): Promise<string | null> => {
  try {
    // Verificar si ya existe una ubicación para este usuario
    const userLocationsQuery = query(
      collection(firestore, 'userLocations'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(userLocationsQuery);
    
    if (!snapshot.empty) {
      // Actualizar ubicación existente
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        coordinates,
        lastUpdated: serverTimestamp()
      });
      
      return snapshot.docs[0].id;
    }
    
    // Crear nueva ubicación
    const newLocation: UserLocation = {
      userId,
      coordinates,
      lastUpdated: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(firestore, 'userLocations'), newLocation);
    return docRef.id;
  } catch (error) {
    console.error('Error guardando ubicación del usuario:', error);
    return null;
  }
};

// Obtener todas las ubicaciones de interés
export const getMapLocations = async (
  type?: string
): Promise<MapLocation[]> => {
  try {
    let locationsQuery;
    
    if (type && type !== 'all') {
      locationsQuery = query(
        collection(firestore, 'mapLocations'),
        where('type', '==', type)
      );
    } else {
      locationsQuery = collection(firestore, 'mapLocations');
    }
    
    const snapshot = await getDocs(locationsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MapLocation[];
  } catch (error) {
    console.error('Error obteniendo ubicaciones del mapa:', error);
    return [];
  }
};

// Agregar una nueva ubicación al mapa
export const addMapLocation = async (
  location: Omit<MapLocation, 'id' | 'createdAt'>,
  userId: string
): Promise<string | null> => {
  try {
    const newLocation = {
      ...location,
      createdBy: userId,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(firestore, 'mapLocations'), newLocation);
    return docRef.id;
  } catch (error) {
    console.error('Error agregando ubicación al mapa:', error);
    return null;
  }
};

// Eliminar una ubicación del mapa
export const deleteMapLocation = async (
  locationId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Verificar que el usuario es el creador
    const locationDoc = await getDocs(
      query(
        collection(firestore, 'mapLocations'),
        where('createdBy', '==', userId)
      )
    );
    
    if (locationDoc.empty) {
      throw new Error('No tienes permisos para eliminar esta ubicación');
    }
    
    await deleteDoc(doc(firestore, 'mapLocations', locationId));
    return true;
  } catch (error) {
    console.error('Error eliminando ubicación del mapa:', error);
    return false;
  }
};

// Obtener dirección a partir de coordenadas (geocoding inverso)
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (result.length > 0) {
      const { street, city, region, country } = result[0];
      const addressParts = [street, city, region, country].filter(Boolean);
      return addressParts.join(', ');
    }
    
    return 'Dirección desconocida';
  } catch (error) {
    console.error('Error obteniendo dirección desde coordenadas:', error);
    return 'Error al obtener dirección';
  }
};

// Buscar ubicación por nombre o dirección (geocoding)
export const searchLocation = async (query: string): Promise<Location.LocationGeocodedLocation[]> => {
  try {
    return await Location.geocodeAsync(query);
  } catch (error) {
    console.error('Error buscando ubicación:', error);
    return [];
  }
};

// Calcular distancia entre dos puntos (en kilómetros)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distancia en km
  
  return d;
};

// Convertir grados a radianes
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};