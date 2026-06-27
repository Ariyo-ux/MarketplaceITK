import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedProduct = {
  id: string;
  title: string;
  price: number;
  imageBase64: string;
  sellerName: string;
};

type SavedContextType = {
  savedProducts: SavedProduct[];
  isSaved: (productId: string) => boolean;
  toggleSaved: (product: SavedProduct) => void;
};

const SavedContext = createContext<SavedContextType>({
  savedProducts: [],
  isSaved: () => false,
  toggleSaved: () => {},
});

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('@savedProducts');
        if (stored) {
          setSavedProducts(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading saved products', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@savedProducts', JSON.stringify(savedProducts));
    }
  }, [savedProducts, isLoaded]);

  const isSaved = (productId: string) => {
    return savedProducts.some(p => p.id === productId);
  };

  const toggleSaved = (product: SavedProduct) => {
    setSavedProducts(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  return (
    <SavedContext.Provider value={{ savedProducts, isSaved, toggleSaved }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  return useContext(SavedContext);
}
