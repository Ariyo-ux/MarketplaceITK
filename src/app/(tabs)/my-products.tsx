import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTransaction } from '../../context/TransactionContext';

type Product = {
  id: string;
  title: string;
  price: number;
  imageBase64: string;
  category: string;
  condition: string;
  status: string;
  stock?: number;
  createdAt: any;
};

export default function MyProductsScreen() {
  const { user } = useAuth();
  const { simulateIncomingOrder } = useChat();
  const { addTransaction } = useTransaction();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // ... [Skipping unchanged use effect] ...
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, 'id'>),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
      setProducts(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching my products:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="person-outline" size={72} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Belum Masuk</Text>
          <Text style={styles.emptySubtitle}>Masuk terlebih dahulu untuk melihat produk yang kamu jual.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activeCount = products.filter(p => p.status === 'active').length;

  // Pool pembeli dummy ITK
  const DUMMY_BUYERS = [
    { id: 'buyer_budi', name: 'Budi Santoso', nim: '11231045' },
    { id: 'buyer_rina', name: 'Rina Melati', nim: '04231021' },
    { id: 'buyer_ahmad', name: 'Ahmad Subarjo', nim: '10231033' },
    { id: 'buyer_siti', name: 'Siti Nurhaliza', nim: '20231007' },
    { id: 'buyer_dani', name: 'Dani Pratama', nim: '07231018' },
    { id: 'buyer_ayu', name: 'Ayu Lestari', nim: '15231042' },
  ];

  const handleSimulateOrder = (item: Product) => {
    // Pilih pembeli random
    const buyer = DUMMY_BUYERS[Math.floor(Math.random() * DUMMY_BUYERS.length)];
    // Jumlah beli acak (1-3, maks stock)
    const maxQty = Math.min(item.stock || 1, 3);
    const qty = Math.max(1, Math.floor(Math.random() * maxQty) + 1);
    const totalPrice = item.price * qty;

    // Chat masuk dari pembeli
    simulateIncomingOrder(item.title, totalPrice, item.imageBase64 || '', buyer.name, buyer.id);
    
    // Tambahkan transaksi Penjualan ke riwayat
    addTransaction({
      type: 'Jual',
      status: 'Proses',
      title: item.title,
      price: `Rp ${totalPrice.toLocaleString('id-ID')}`,
      priceNum: totalPrice,
      image: item.imageBase64 || '',
      otherUser: buyer.name,
      productId: item.id,
      quantity: qty,
    });

    Alert.alert(
      "📦 Pesanan Baru Masuk!", 
      `${buyer.name} (${buyer.nim}) memesan ${item.title} sebanyak ${qty} pcs.\n\nSilakan buka Chating > Notifikasi untuk ACC atau Tolak pesanan.`
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 56) }]}>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Produk Saya</Text>
          <Text style={styles.subtitle}>{activeCount} produk aktif</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat produkmu...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, products.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="cube-outline" size={72} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>Belum Ada Produk</Text>
              <Text style={styles.emptySubtitle}>Kamu belum menjual apapun. Tap "Sell Item" untuk mulai!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <View style={styles.card}>
                <Image
                  source={{ uri: item.imageBase64 }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.price}>Rp {item.price.toLocaleString('id-ID')}</Text>
                  <View style={[styles.statusBadge, item.status === 'sold' && styles.statusBadgeSold]}>
                    <Text style={[styles.statusText, item.status === 'sold' && styles.statusTextSold]}>
                      {item.status === 'active' ? 'Aktif' : 'Terjual'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </View>
              {item.status === 'active' && (
                <TouchableOpacity 
                  style={styles.simulateButton}
                  onPress={() => handleSimulateOrder(item)}
                >
                  <Ionicons name="cart" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.simulateButtonText}>Simulasi Pembeli Masuk</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    marginRight: 14,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  statusBadgeSold: {
    backgroundColor: '#FBE9E7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#388E3C',
  },
  statusTextSold: {
    color: '#D32F2F',
  },
  cardWrapper: {
    marginBottom: 12,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -16,
    paddingTop: 20,
    zIndex: -1,
  },
  simulateButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});