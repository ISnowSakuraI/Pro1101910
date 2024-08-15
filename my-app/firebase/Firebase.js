// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
