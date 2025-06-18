import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from './firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';

// Interfaces
export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  university?: string;
  photo?: string;
  interests?: string[];
  origin?: string;
  createdAt?: any;
  isAdmin?: boolean;
  isMentor?: boolean;
}

// Crear o actualizar un documento de usuario en Firestore
export const createOrUpdateUserProfile = async (
  user: User, 
  profileData?: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Crear nuevo documento de usuario
      const newUserData: UserProfile = {
        uid: user.uid,
        email: user.email,
        name: profileData?.name || user.displayName || 'Usuario',
        university: profileData?.university || '',
        photo: profileData?.photo || user.photoURL || '',
        interests: profileData?.interests || [],
        origin: profileData?.origin || '',
        createdAt: serverTimestamp(),
        isAdmin: false,
        isMentor: false,
      };
      
      await setDoc(userRef, newUserData);
    } else if (profileData) {
      // Actualizar documento existente con nuevos datos
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creando/actualizando perfil de usuario:', error);
    throw error;
  }
};

// Obtener perfil de usuario desde Firestore
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as unknown as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo perfil de usuario:', error);
    throw error;
  }
};

// Guardar perfil en AsyncStorage para uso offline
export const saveProfileToStorage = async (profile: Partial<UserProfile>): Promise<void> => {
  try {
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
  } catch (error) {
    console.error('Error guardando perfil en AsyncStorage:', error);
    throw error;
  }
};

// Obtener perfil desde AsyncStorage
export const getProfileFromStorage = async (): Promise<Partial<UserProfile> | null> => {
  try {
    const profile = await AsyncStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error obteniendo perfil desde AsyncStorage:', error);
    return null;
  }
};

// Verificar si un usuario es administrador
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    return !!profile?.isAdmin;
  } catch (error) {
    console.error('Error verificando si el usuario es administrador:', error);
    return false;
  }
};