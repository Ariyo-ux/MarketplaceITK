import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export type Order = {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  totalPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: 'Proses' | 'Selesai' | 'Dibatalkan';
  createdAt: any;
};

type OrderContextType = {
  sellerOrders: Order[];      // Pesanan masuk untuk penjual (user sebagai penjual)
  buyerOrders: Order[];       // Pesanan keluar dari pembeli (user sebagai pembeli)
  createOrder: (data: Omit<Order, 'id' | 'createdAt'>) => Promise<string>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  isLoading: boolean;
};

const OrderContext = createContext<OrderContextType>({
  sellerOrders: [],
  buyerOrders: [],
  createOrder: async () => '',
  acceptOrder: async () => {},
  rejectOrder: async () => {},
  isLoading: true,
});

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for orders where current user is the SELLER
  useEffect(() => {
    if (!user) {
      setSellerOrders([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: Order[] = snapshot.docs
        .map(d => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
      setSellerOrders(orders);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching seller orders:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Listen for orders where current user is the BUYER
  useEffect(() => {
    if (!user) {
      setBuyerOrders([]);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: Order[] = snapshot.docs
        .map(d => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
      setBuyerOrders(orders);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Create a new order in Firestore
  const createOrder = async (data: Omit<Order, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  };

  // Seller accepts the order → status = Selesai
  const acceptOrder = async (orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'Selesai',
    });
  };

  // Seller rejects the order → status = Dibatalkan, restore stock
  const rejectOrder = async (orderId: string) => {
    // Get order data first to restore stock
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      const orderData = orderSnap.data();

      // Restore product stock in Firebase
      if (orderData.productId) {
        try {
          const prodRef = doc(db, 'products', orderData.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const currentStock = prodSnap.data().stock ?? 0;
            const restoredStock = currentStock + (orderData.quantity || 1);
            await updateDoc(prodRef, {
              stock: restoredStock,
              status: restoredStock > 0 ? 'active' : 'sold',
            });
          }
        } catch (e) {
          console.error('Error restoring stock:', e);
        }
      }
    }

    await updateDoc(orderRef, {
      status: 'Dibatalkan',
    });
  };

  return (
    <OrderContext.Provider value={{ sellerOrders, buyerOrders, createOrder, acceptOrder, rejectOrder, isLoading }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}
