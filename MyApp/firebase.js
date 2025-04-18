// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBgTukUaL5oSSSCG0y6i-g48HwGsE5Wt4M",
    authDomain: "foreign-e6040.firebaseapp.com",
    projectId: "foreign-e6040",
    storageBucket: "foreign-e6040.firebasestorage.app",
    messagingSenderId: "497729458678",
    appId: "1:497729458678:android:875fe19ecc24328f2cf7d7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export default app;