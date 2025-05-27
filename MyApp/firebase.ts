// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Import Realtime Database
 // @ts-ignore
import { getReactNativePersistence, GoogleAuthProvider, FacebookAuthProvider, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
 import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from "react-native";
 
 const firebaseConfig = {
  apiKey: "AIzaSyBLVmPAr7tG27sSrMCdhfhvgaNTwlfeuqg",
  authDomain: "foreign-e6040.firebaseapp.com",
  databaseURL:"https://foreign-e6040-default-rtdb.firebaseio.com/", // Ensure this is correct
  projectId: "foreign-e6040",
  storageBucket: "foreign-e6040.firebasestorage.app",
  messagingSenderId: "497729458678",
  appId: "1:497729458678:web:ae02b825dac23f612cf7d7",
  measurementId: "G-5P62E0ZZ9Q"
};

const app = initializeApp(firebaseConfig);


export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? indexedDBLocalPersistence : getReactNativePersistence(ReactNativeAsyncStorage)
});
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app); // Initialize and export Realtime Database

export default app;
