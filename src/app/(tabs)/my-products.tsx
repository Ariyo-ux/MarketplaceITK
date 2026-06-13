import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

type Product = {
  id: string;
  title: string;
  price: number;
  imageBase64: string;
  category: string;
  condition: string;
  status: string;
  createdAt: any;
};

export default function MyProductsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Query tanpa orderBy agar tidak perlu composite index
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Produk Saya</Text>
        <Text style={styles.subtitle}>{activeCount} produk aktif</Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
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
    marginBottom: 12,
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
});