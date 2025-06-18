// Exportar todo desde los archivos individuales
export * from './config';
export * from './auth';
export * from './firestore';
export * from './storage';
export * from './database';

// También exportar las instancias directamente para compatibilidad
import { auth, firestore, storage, database } from './config';
export { auth, firestore, storage, database };