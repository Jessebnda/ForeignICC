import { 
  ref, 
  set, 
  push, 
  update, 
  remove, 
  get, 
  onValue, 
  off,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { database } from '../../firebase';

// Escribir datos
export const setData = async (path: string, data: any): Promise<void> => {
  try {
    await set(ref(database, path), data);
  } catch (error) {
    console.error(`Error setting data at ${path}:`, error);
    throw error;
  }
};

// Actualizar datos parcialmente
export const updateData = async (path: string, updates: any): Promise<void> => {
  try {
    await update(ref(database, path), updates);
  } catch (error) {
    console.error(`Error updating data at ${path}:`, error);
    throw error;
  }
};

// Crear nuevo nodo con ID automático
export const pushData = async (path: string, data: any): Promise<string | null> => {
  try {
    const newRef = push(ref(database, path));
    await set(newRef, data);
    return newRef.key;
  } catch (error) {
    console.error(`Error pushing data to ${path}:`, error);
    throw error;
  }
};

// Eliminar datos
export const removeData = async (path: string): Promise<void> => {
  try {
    await remove(ref(database, path));
  } catch (error) {
    console.error(`Error removing data at ${path}:`, error);
    throw error;
  }
};

// Leer datos una vez
export const getData = async (path: string): Promise<any> => {
  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error getting data from ${path}:`, error);
    throw error;
  }
};

// Buscar datos con consulta
export const queryData = async (
  path: string, 
  childKey: string, 
  childValue: any
): Promise<any[]> => {
  try {
    const dbRef = ref(database, path);
    const dbQuery = query(dbRef, orderByChild(childKey), equalTo(childValue));
    const snapshot = await get(dbQuery);
    
    const results: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        results.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error(`Error querying data from ${path}:`, error);
    throw error;
  }
};

// Escuchar cambios (tiempo real)
export const listenForData = (
  path: string, 
  callback: (data: any) => void
): () => void => {
  const dbRef = ref(database, path);
  
  onValue(dbRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  
  // Devolver función para dejar de escuchar
  return () => off(dbRef);
};