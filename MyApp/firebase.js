// firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBgTukUaL5oSSSCG0y6i-g48HwGsE5Wt4M",
    authDomain: "foreign-e6040.firebaseapp.com",
    projectId: "foreign-e6040",
    storageBucket: "foreign-e6040.firebasestorage.app",
    messagingSenderId: "497729458678",
    appId: "1:497729458678:android:875fe19ecc24328f2cf7d7"
};

// Inicializa la app de Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firebase Auth con persistencia usando AsyncStorage
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Añade esta línea para compatibilidad
export const getAuthInstance = () => getAuth(app);

// Inicializa Firestore
const firestore = getFirestore(app);

export { auth, firestore };
export default app;