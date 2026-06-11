import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, isConfigured } from "../config/firebase";

// Struktur data user
export type User = {
  id: string;
  name: string;
  email: string;
  nim?: string;
  prodi?: string;
  angkatan?: string;
  phone?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    phone?: string,
    password?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor status login Firebase
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ambil data user dari Firestore
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              name: userData.name || "",
              email: firebaseUser.email || "",
              nim: userData.nim || "",
              prodi: userData.prodi || "",
              angkatan: userData.angkatan || "",
              phone: userData.phone || "",
            });
          } else {
            // Fallback jika tidak ada di Firestore
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "Pengguna",
              email: firebaseUser.email || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login dengan Firebase Auth
  const login = async (email: string, password?: string) => {
    if (!isConfigured) {
      throw new Error(
        "Sistem Firebase belum dikonfigurasi. Silakan masukkan API Key di file firebase.ts terlebih dahulu.",
      );
    }
    if (!password) throw new Error("Kata sandi dibutuhkan.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Register dengan Firebase Auth & simpan ke Firestore
  const register = async (
    name: string,
    email: string,
    phone?: string,
    password?: string,
  ): Promise<void> => {
    if (!isConfigured) {
      throw new Error(
        "Sistem Firebase belum dikonfigurasi. Silakan masukkan API Key di file firebase.ts terlebih dahulu.",
      );
    }
    if (!password) throw new Error("Kata sandi dibutuhkan.");

    // 1. Buat akun di Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const uid = userCredential.user.uid;

    // Ekstrak NIM dari email (contoh: 04231013@student.itk.ac.id -> 04231013)
    const nim = email.split("@")[0];

    // Ekstrak kode prodi (2 digit pertama) dan angkatan (2 digit setelah prodi)
    const prodiCode = nim.substring(0, 2);
    const angkatanCode = nim.substring(2, 4);

    let prodi = "Institut Teknologi Kalimantan";
    let angkatan = angkatanCode ? `20${angkatanCode}` : ""; // Asumsi tahun 20xx

    // Pemetaan kode prodi ITK
    switch (prodiCode) {
      case "01":
        prodi = "Fisika";
        break;
      case "02":
        prodi = "Matematika";
        break;
      case "03":
        prodi = "Teknik Mesin";
        break;
      case "04":
        prodi = "Teknik Elektro";
        break;
      case "05":
        prodi = "Teknik Kimia";
        break;
      case "06":
        prodi = "Teknik Material dan Metalurgi";
        break;
      case "07":
        prodi = "Teknik Sipil";
        break;
      case "08":
        prodi = "Perencanaan Wilayah dan Kota";
        break;
      case "09":
        prodi = "Perkapalan";
        break;
      case "10":
        prodi = "Sistem Informasi";
        break;
      case "11":
        prodi = "Informatika";
        break;
      case "12":
        prodi = "Teknik Industri";
        break;
      case "13":
        prodi = "Teknik Lingkungan";
        break;
      case "14":
        prodi = "Teknik Kelautan";
        break;
      case "15":
        prodi = "Arsitektur";
        break;
      case "16":
        prodi = "Statistika";
        break;
      case "17":
        prodi = "Ilmu Aktuaria";
        break;
      case "18":
        prodi = "Rekayasa Keselamatan";
        break;
      case "19":
        prodi = "Teknologi Pangan";
        break;
      case "20":
        prodi = "Bisnis Digital";
        break;
      case "21":
        prodi = "Teknik Logistik";
        break;
      case "22":
        prodi = "Desain Komunikasi Visual";
        break;
    }

    // 2. Simpan data detail ke Firestore
    if (!email.endsWith("@student.itk.ac.id")) {
      alert(
        "Pendaftaran gagal! Anda wajib menggunakan email resmi @student.itk.ac.id",
      );
      return; // Menghentikan fungsi jika email tidak valid
    }

    await setDoc(doc(db, "users", uid), {
      name: name,
      email: email,
      phone: phone || "",
      nim: nim,
      prodi: prodi,
      angkatan: angkatan,
      createdAt: new Date().toISOString(),
    });
  };

  // Logout
  const logout = async () => {
    if (isConfigured) {
      await signOut(auth);
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
