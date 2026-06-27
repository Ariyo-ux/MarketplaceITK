import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSaved } from '../../context/SavedContext';

export default function SavedProductsScreen() {
  const router = useRouter();
  const { savedProducts } = useSaved();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Barang Disimpan</Text>
          <Text style={styles.subtitle}>{savedProducts.length} barang tersimpan</Text>
        </View>
      </View>

      {savedProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Belum ada barang yang disimpan</Text>
        </View>
      ) : (
        <FlatList
          data={savedProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              <Image source={{ uri: item.imageBase64 || 'https://via.placeholder.com/150' }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.seller}>Penjual: {item.sellerName}</Text>
                <Text style={styles.price}>Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>
            </TouchableOpacity>
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
    paddingTop: 60,
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
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  seller: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
  },
});