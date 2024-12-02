import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // ใช้ import ที่เรียบง่าย
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

// คอนฟิก Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBPzHJDZ7RIDu0_hK-RtQCRiWrmn0sdnrs",
  authDomain: "pro1910-257c8.firebaseapp.com",
  projectId: "pro1910-257c8",
  storageBucket: "pro1910-257c8.appspot.com",
  messagingSenderId: "983398933034",
  appId: "1:983398933034:web:125870997bcde02d289953",
  measurementId: "G-4T1J7XZHEP",
};

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);

// เริ่มต้น Auth ด้วยการเก็บข้อมูล (Persistence)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ส่งออกบริการ Firebase
export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
