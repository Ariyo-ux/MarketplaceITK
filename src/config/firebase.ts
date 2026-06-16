import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";
// @ts-ignore
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADeFr_LEMSp2v3c8_BsfzI78RruPXMP5o",
  authDomain: "marketplaceitk.firebaseapp.com",
  projectId: "marketplaceitk",
  storageBucket: "marketplaceitk.firebasestorage.app",
  messagingSenderId: "20400707022",
  appId: "1:20400707022:web:71a8ddf0b2972e2cc5079f",
};

// Cek apakah config masih menggunakan teks bawaan (belum diisi)
export const isConfigured = firebaseConfig.apiKey !== "API_KEY_ANDA";

// Initialize Firebase (hanya jika sudah dikonfigurasi)
let app: any = null;
if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

// Gunakan initializeAuth + AsyncStorage agar sesi login tersimpan saat app ditutup
let auth: any = {} as any;
if (app) {
  try {
    if (Platform.OS === "web") {
      // Di Web, Firebase otomatis mengatur persistence ke browserLocalPersistence
      // Jadi kita tidak perlu memaksakan getReactNativePersistence yang tidak tersedia di Web
      auth = getAuth(app);
    } else {
      // Menyiasati error "has no exported member" pada TypeScript di versi Firebase tertentu
      const { getReactNativePersistence: getRNP } = require("firebase/auth");
      auth = initializeAuth(app, {
        persistence: getRNP(AsyncStorage),
      });
    }
  } catch (error: any) {
    if (error.code === "auth/already-initialized") {
      auth = getAuth(app);
    } else {
      console.error("Firebase Auth Init Error:", error);
    }
  }
}

const db = app ? getFirestore(app) : ({} as any);

export { auth, db };
