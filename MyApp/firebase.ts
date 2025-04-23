// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLVmPAr7tG27sSrMCdhfhvgaNTwlfeuqg",
  authDomain: "foreign-e6040.firebaseapp.com",
  projectId: "foreign-e6040",
  storageBucket: "foreign-e6040.firebasestorage.app",
  messagingSenderId: "497729458678",
  appId: "1:497729458678:web:ae02b825dac23f612cf7d7",
  measurementId: "G-5P62E0ZZ9Q"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;
