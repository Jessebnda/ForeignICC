// firebase.js
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
// Importa otros módulos que necesites (por ejemplo, storage, messaging)

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "foreign-e6040",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "497729458678",
    appId: "TU_APP_ID"
};

// Inicializa Firebase solo si aún no se ha inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();
// Exporta otros servicios según necesites
export default firebase;