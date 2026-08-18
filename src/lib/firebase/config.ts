import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCVyiIZ8VCThds3AKH6wd9BnqZw2qjQqTM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "insuite-9a21d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "insuite-9a21d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "insuite-9a21d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "875711687030",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:875711687030:web:50827b79dfbf59ce68f257",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-09F8G03TDT",
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
