import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-ignore – getReactNativePersistence type definition hilang di firebase v12, tapi berfungsi di runtime
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
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
const auth = app
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : ({} as any);

const db = app ? getFirestore(app) : ({} as any);

export { auth, db };
