import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBPzHJDZ7RIDu0_hK-RtQCRiWrmn0sdnrs",
  authDomain: "pro1910-257c8.firebaseapp.com",
  projectId: "pro1910-257c8",
  storageBucket: "pro1910-257c8.appspot.com",
  messagingSenderId: "983398933034",
  appId: "1:983398933034:web:125870997bcde02d289953",
  measurementId: "G-4T1J7XZHEP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error("Error initializing Firebase Auth:", error);
    throw error;
  }
}

// Export Firebase services
export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);