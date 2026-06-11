import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DUMMY_PRODUCTS, Product } from '../../data/products';



export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Memastikan id dibaca sebagai string, bukan array of strings
  const productId = Array.isArray(id) ? id[0] : id;
  const product = DUMMY_PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>Produk tidak ditemukan!</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleContactSeller = () => {
    const text = `Halo kak ${product.seller}, saya tertarik dengan barang '${product.title}' yang dijual di Marketplace ITK. Apakah masih ada?`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}&phone=${product.phone}`;
    
    Alert.alert(
      "Hubungi Penjual",
      "Apakah Anda ingin membuka WhatsApp untuk menghubungi penjual?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Buka WA", 
          onPress: () => {
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Alert.alert("Gagal", "Aplikasi WhatsApp tidak ditemukan di perangkat ini.");
              }
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: product.image }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.category}</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{product.title}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Kondisi</Text>
              <Text style={styles.infoValue}>{product.condition}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dilihat</Text>
              <Text style={styles.infoValue}>124 kali</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.sellerSection}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={24} color="#007AFF" />
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller}</Text>
              <Text style={styles.sellerRole}>Mahasiswa ITK</Text>
            </View>
            <TouchableOpacity style={styles.visitStoreButton}>
              <Text style={styles.visitStoreText}>Lihat Profil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="heart-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton} onPress={handleContactSeller}>
          <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" style={styles.waIcon} />
          <Text style={styles.contactButtonText}>Hubungi Penjual</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#EAEAEA',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  sellerRole: {
    fontSize: 12,
    color: '#888888',
  },
  visitStoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 16,
  },
  visitStoreText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 30, // untuk area aman di bawah
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  saveButton: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
