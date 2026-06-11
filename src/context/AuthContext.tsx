import React, { createContext, useState, useContext } from 'react';

// Struktur data user (dummy)
export type User = {
  id: string;
  name: string;
  email: string;
  nim?: string;
  prodi?: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string) => void;
  register: (name: string, email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Simulasi Login sederhana (terima email apa saja)
  const login = (email: string) => {
    // Sebagai simulasi, kita langsung buat profil berdasarkan email yang dimasukkan
    setUser({
      id: '1',
      name: 'Ariyo Arianto', // Mengembalikan nama asli
      email: email,
      nim: '04231013', // Mengembalikan NIM asli
      prodi: 'Teknik Elektro', // Mengembalikan Prodi asli
    });
  };

  // Simulasi Register
  const register = (name: string, email: string) => {
    setUser({
      id: '1',
      name: name || 'Ariyo Arianto',
      email: email,
      nim: '04231013',
      prodi: 'Teknik Elektro',
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook untuk memudahkan pemanggilan Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
