import { 
  createGeoPoint, 
  setDocument, 
  queryCollection, 
  where, 
  serverTimestamp 
} from './firebase/firestore';
import { uploadMultipleImages } from './firebase/storage';

// Constantes
const MAP_LOCATIONS_COLLECTION = 'mapLocations';

// Tipos
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface MapLocation {
  id: string;
  locationId: string;
  title: string;
  description: string;
  geoPoint: LocationCoords;
  type: string[];
  imageUrl: string;
  imageUrls?: string[];
  createdBy: string;
  rating: Array<{ userId: string; stars: number }>;
  createdAt: any;
}

interface CreateLocationInput {
  title: string;
  description: string;
  coords: LocationCoords;
  types: string[];
  rating: number;
  images?: string[];
}

// Crear nueva ubicación
export const createLocation = async (
  userId: string, 
  location: CreateLocationInput
): Promise<string> => {
  try {
    const locationId = Date.now().toString();
    
    // Subir imágenes si existen
    let imageUrls: string[] = [];
    if (location.images && location.images.length > 0) {
      imageUrls = await uploadMultipleImages(`posts/${locationId}`, location.images);
    }
    
    // Crear objeto de ubicación
    const newLocation = {
      locationId,
      title: location.title.trim(),
      description: location.description.trim(),
      geoPoint: createGeoPoint(location.coords.latitude, location.coords.longitude),
      type: location.types,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
      imageUrls,
      createdBy: userId,
      rating: [{ userId, stars: location.rating }],
      createdAt: serverTimestamp()
    };
    
    // Guardar en Firestore
    await setDocument(MAP_LOCATIONS_COLLECTION, locationId, newLocation);
    
    return locationId;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

// Obtener todas las ubicaciones
export const getAllLocations = async (): Promise<MapLocation[]> => {
  try {
    const locations = await queryCollection<any>(MAP_LOCATIONS_COLLECTION);
    
    return locations.map(loc => ({
      ...loc,
      geoPoint: {
        latitude: loc.geoPoint.latitude,
        longitude: loc.geoPoint.longitude
      }
    }));
  } catch (error) {
    console.error('Error getting all locations:', error);
    throw error;
  }
};

// Obtener ubicaciones por usuario
export const getLocationsByUser = async (userId: string): Promise<MapLocation[]> => {
  try {
    const locations = await queryCollection<any>(
      MAP_LOCATIONS_COLLECTION,
      [where('createdBy', '==', userId)]
    );
    
    return locations.map(loc => ({
      ...loc,
      geoPoint: {
        latitude: loc.geoPoint.latitude,
        longitude: loc.geoPoint.longitude
      }
    }));
  } catch (error) {
    console.error(`Error getting locations for user ${userId}:`, error);
    throw error;
  }
};

// Obtener ubicaciones por tipo
export const getLocationsByType = async (types: string[]): Promise<MapLocation[]> => {
  try {
    // En Firestore no podemos usar operadores OR en arrays directamente
    // así que tenemos que obtener todos y filtrar
    const allLocations = await getAllLocations();
    
    return allLocations.filter(loc => 
      loc.type.some(t => types.includes(t))
    );
  } catch (error) {
    console.error('Error getting locations by type:', error);
    throw error;
  }
};

// Obtener ubicaciones de amigos
export const getFriendsLocations = async (
  userId: string,
  friendIds: string[]
): Promise<MapLocation[]> => {
  try {
    // Si no hay amigos, devolver vacío
    if (!friendIds.length) return [];
    
    const allLocations = await getAllLocations();
    
    return allLocations.filter(loc => 
      friendIds.includes(loc.createdBy) || loc.createdBy === userId
    );
  } catch (error) {
    console.error('Error getting friends locations:', error);
    throw error;
  }
};