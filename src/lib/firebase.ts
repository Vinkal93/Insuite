import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyCVyiIZ8VCThds3AKH6wd9BnqZw2qjQqTM",
  authDomain: "insuite-9a21d.firebaseapp.com",
  projectId: "insuite-9a21d",
  storageBucket: "insuite-9a21d.firebasestorage.app",
  messagingSenderId: "875711687030",
  appId: "1:875711687030:web:50827b79dfbf59ce68f257",
  measurementId: "G-09F8G03TDT"
};

// Initialize Firebase safely for SSR / Client environments
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let analyticsInstance: Analytics | null = null;

export const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (err) {
    console.warn("Firebase Analytics could not be initialized:", err);
  }
  return null;
};
