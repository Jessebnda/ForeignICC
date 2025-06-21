import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { storage } from '../../firebase';

// Subir archivo desde URI
export const uploadFromUri = async (
  path: string, 
  uri: string
): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading from URI:', error);
    throw error;
  }
};

// Subir múltiples imágenes
export const uploadMultipleImages = async (
  basePath: string, 
  uris: string[]
): Promise<string[]> => {
  try {
    const downloadURLs: string[] = [];
    
    for (const uri of uris) {
      const filename = `${basePath}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const downloadUrl = await uploadFromUri(filename, uri);
      downloadURLs.push(downloadUrl);
    }
    
    return downloadURLs;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

// Eliminar archivo
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Obtener URL de descarga
export const getFileURL = async (path: string): Promise<string> => {
  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

// Crear referencia a un archivo
export const getStorageRef = (path: string) => {
  return ref(storage, path);
};