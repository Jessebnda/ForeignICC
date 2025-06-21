import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase/config';

// Interfaces
export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

// Seleccionar imagen de la galería
export const pickImageFromLibrary = async (options: ImagePickerOptions = {}): Promise<string | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect,
      quality: options.quality ?? 1,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error seleccionando imagen:', error);
    throw error;
  }
};

// Procesar imagen para optimizarla
export const processImage = async (
  uri: string, 
  options: { width?: number; quality?: number } = {}
): Promise<string> => {
  try {
    const processed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: options.width || 1000 } }],
      { compress: options.quality || 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return processed.uri;
  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw error;
  }
};

// Convertir URI a Blob para subir a Firebase
export const uriToBlob = async (uri: string): Promise<Blob> => {
  try {
    const response = await fetch(uri);
    return await response.blob();
  } catch (error) {
    console.error('Error convirtiendo uri a blob:', error);
    throw error;
  }
};

// Subir imagen a Firebase Storage
export const uploadImageToFirebase = async (
  uri: string, 
  path: string,
  processOptions: { width?: number; quality?: number } = {}
): Promise<string> => {
  try {
    // Procesar imagen para optimizarla
    const processedUri = await processImage(uri, processOptions);
    
    // Convertir a blob
    const blob = await uriToBlob(processedUri);
    
    // Crear referencia y subir
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    
    // Obtener URL de descarga
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error subiendo imagen a Firebase:', error);
    throw error;
  }
};

// Subir imagen de perfil
export const uploadProfileImage = async (
  uri: string, 
  userId: string
): Promise<string> => {
  const path = `profileImages/${userId}_${Date.now()}.jpg`;
  return await uploadImageToFirebase(uri, path, { width: 800, quality: 0.8 });
};