// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Import Realtime Database
 // @ts-ignore
import { getReactNativePersistence, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
 import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from "react-native";
import Constants from 'expo-constants';

const firebase = Constants.expoConfig?.extra?.firebase;

// Configuración de Firebase
const firebaseConfig = {
  apiKey: firebase.apiKey,
  authDomain: firebase.authDomain,
  databaseURL: firebase.databaseURL,
  projectId: firebase.projectId,
  storageBucket: firebase.storageBucket,
  messagingSenderId: firebase.messagingSenderId,
  appId: firebase.appId,
  measurementId: firebase.measurementId,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? indexedDBLocalPersistence 
    : getReactNativePersistence(ReactNativeAsyncStorage)
});

export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

export default app;