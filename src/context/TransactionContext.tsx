import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export type Transaction = {
  id: string;
  type: 'Beli' | 'Jual' | 'Sewa';
  status: 'Proses' | 'Selesai' | 'Dibatalkan';
  title: string;
  date: string;
  price: string;
  priceNum: number;
  image: string;
  otherUser: string;
  productId?: string;
  quantity?: number;
};

export type BalanceHistoryItem = {
  id: string;
  type: 'masuk' | 'keluar';
  amount: number;
  description: string;
  timestamp: string; // ISO string
  balanceAfter: number;
};

type TransactionContextType = {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => Transaction;
  balance: number;
  balanceHistory: BalanceHistoryItem[];
  deductBalance: (amount: number, description?: string) => void;
  refundBalance: (amount: number, description?: string) => void;
  cancelTransaction: (id: string, reason: string) => void;
  acceptTransaction: (id: string) => void;
};

const INITIAL_BALANCE = 5000000;

const INITIAL_BALANCE_HISTORY: BalanceHistoryItem[] = [
  {
    id: 'BH-001',
    type: 'masuk',
    amount: 5000000,
    description: 'Saldo awal akun',
    timestamp: '2026-06-20T08:00:00.000Z',
    balanceAfter: 5000000,
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-1001',
    type: 'Beli',
    status: 'Selesai',
    title: 'Kalkulator Casio FX-991EX',
    date: '26 Jun 2026',
    price: 'Rp 150.000',
    priceNum: 150000,
    image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&q=80',
    otherUser: 'Ahmad Subarjo',
  },
  {
    id: 'TRX-1002',
    type: 'Jual',
    status: 'Proses',
    title: 'Buku Kalkulus Edisi 9',
    date: '25 Jun 2026',
    price: 'Rp 85.000',
    priceNum: 85000,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80',
    otherUser: 'Siti Nurhaliza',
  },
  {
    id: 'TRX-1003',
    type: 'Sewa',
    status: 'Selesai',
    title: 'Jas Almamater ITK (Size L)',
    date: '20 Jun 2026',
    price: 'Rp 50.000 / minggu',
    priceNum: 50000,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
    otherUser: 'Budi Santoso',
  },
  {
    id: 'TRX-1004',
    type: 'Beli',
    status: 'Dibatalkan',
    title: 'Mouse Wireless Logitech',
    date: '15 Jun 2026',
    price: 'Rp 75.000',
    priceNum: 75000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
    otherUser: 'Rina Melati',
  },
];

const TransactionContext = createContext<TransactionContextType>({
  transactions: INITIAL_TRANSACTIONS,
  addTransaction: () => INITIAL_TRANSACTIONS[0],
  balance: INITIAL_BALANCE,
  balanceHistory: INITIAL_BALANCE_HISTORY,
  deductBalance: () => {},
  refundBalance: () => {},
  cancelTransaction: () => {},
  acceptTransaction: () => {},
});

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryItem[]>(INITIAL_BALANCE_HISTORY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) return; // Wait for user to be logged in
    
    setIsLoaded(false);
    const loadData = async () => {
      try {
        const storedTrx = await AsyncStorage.getItem(`@transactions_${user.id}`);
        const storedBalance = await AsyncStorage.getItem(`@balance_${user.id}`);
        const storedHistory = await AsyncStorage.getItem(`@balanceHistory_${user.id}`);
        
        if (storedTrx) setTransactions(JSON.parse(storedTrx));
        else setTransactions(INITIAL_TRANSACTIONS); // Reset to default for new user
        
        if (storedBalance) setBalance(Number(storedBalance));
        else setBalance(INITIAL_BALANCE);
        
        if (storedHistory) setBalanceHistory(JSON.parse(storedHistory));
        else setBalanceHistory(INITIAL_BALANCE_HISTORY);
      } catch (e) {
        console.error('Error loading transaction data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, [user?.id]); // Reload data when user changes

  useEffect(() => {
    if (isLoaded && user?.id) {
      AsyncStorage.setItem(`@transactions_${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, isLoaded, user?.id]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      AsyncStorage.setItem(`@balance_${user.id}`, balance.toString());
    }
  }, [balance, isLoaded, user?.id]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      AsyncStorage.setItem(`@balanceHistory_${user.id}`, JSON.stringify(balanceHistory));
    }
  }, [balanceHistory, isLoaded, user?.id]);

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>): Transaction => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const newId = `TRX-${1000 + transactions.length + 1}`;
    const newTrx: Transaction = {
      ...t,
      id: newId,
      date: dateStr,
    };
    setTransactions(prev => [newTrx, ...prev]);
    return newTrx;
  };

  const deductBalance = (amount: number, description?: string) => {
    setBalance(prev => {
      const newBalance = Math.max(0, prev - amount);
      const historyItem: BalanceHistoryItem = {
        id: `BH-${Date.now()}`,
        type: 'keluar',
        amount,
        description: description || 'Pembayaran pesanan',
        timestamp: new Date().toISOString(),
        balanceAfter: newBalance,
      };
      setBalanceHistory(h => [historyItem, ...h]);
      return newBalance;
    });
  };

  const refundBalance = (amount: number, description?: string) => {
    setBalance(prev => {
      const newBalance = prev + amount;
      const historyItem: BalanceHistoryItem = {
        id: `BH-${Date.now()}`,
        type: 'masuk',
        amount,
        description: description || 'Pengembalian dana',
        timestamp: new Date().toISOString(),
        balanceAfter: newBalance,
      };
      setBalanceHistory(h => [historyItem, ...h]);
      return newBalance;
    });
  };

  const cancelTransaction = (id: string, reason: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Dibatalkan' };
      }
      return t;
    }));
  };

  const acceptTransaction = (id: string) => {
    // Find the transaction first before state updates
    const targetTrx = transactions.find(t => t.id === id && t.type === 'Jual' && t.status === 'Proses');
    
    if (!targetTrx) return;
    
    // Update status to Selesai
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Selesai' };
      }
      return t;
    }));
    
    // Add balance from sale
    refundBalance(targetTrx.priceNum, `Penjualan: ${targetTrx.title}`);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, balance, balanceHistory, deductBalance, refundBalance, cancelTransaction, acceptTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  return useContext(TransactionContext);
}
