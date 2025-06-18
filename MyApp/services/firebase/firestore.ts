import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  QueryConstraint,
  serverTimestamp as firestoreServerTimestamp,
  DocumentData,
  GeoPoint,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { firestore } from '../../firebase';

// Obtener documento por ID
export const getDocument = async <T = DocumentData>(
  collectionName: string, 
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as unknown as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

// Crear o actualizar documento
export const setDocument = async (
  collectionName: string, 
  docId: string, 
  data: any
): Promise<string> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    return docId;
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
};

// Actualizar parcialmente un documento
export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: any
): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// Eliminar documento
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Consultar colección con filtros
export const queryCollection = async <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(firestore, collectionName);
    const q = query(collectionRef, ...constraints);
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as unknown as T[];
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};

// Crear un GeoPoint
export const createGeoPoint = (latitude: number, longitude: number): GeoPoint => {
  return new GeoPoint(latitude, longitude);
};

// Generar timestamp del servidor
export const serverTimestamp = () => firestoreServerTimestamp();

// Obtener referencia a documento
export const getDocRef = (collectionName: string, docId: string): DocumentReference => {
  return doc(firestore, collectionName, docId);
};

// Obtener referencia a colección
export const getCollectionRef = (collectionName: string): CollectionReference => {
  return collection(firestore, collectionName);
};

// Exportar utilidades y operadores de firebase para construir queries
export { 
  where, 
  orderBy, 
  limit,
  collection,
  doc
};