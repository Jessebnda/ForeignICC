// Este archivo es sólo para compatibilidad con código existente
// Se recomienda importar directamente desde los nuevos servicios
import { 
  auth, 
  firestore, 
  storage, 
  database 
} from './services/firebase';

export { 
  auth, 
  firestore, 
  storage, 
  database 
};

// Exportar la instancia por defecto para mantener compatibilidad
import app from './services/firebase/config';
export default app;