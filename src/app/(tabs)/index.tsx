import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../config/firebase";

type Product = {
  id: string;
  title: string;
  price: number;
  imageBase64: string;
  category: string;
  sellerName: string;
  condition: string;
  status?: string;
  createdAt: any;
};

const CATEGORIES = [
  "Semua",
  "Buku",
  "Elektronik",
  "Jasa",
  "Pakaian",
  "Lainnya",
];

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = () => {
    setRefreshing(true);
    // Karena menggunakan onSnapshot, data sebenarnya sudah real-time.
    // Timeout ini memberikan efek visual 'refresh' bagi pengguna.
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    // Query tanpa orderBy agar tidak perlu composite index
    // Sorting dilakukan di sisi client. Filter status lama ditangani di client.
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Product[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Product, "id">),
          }))
          // Urutkan dari terbaru ke terlama di sisi client
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.seconds ?? 0;
            const bTime = b.createdAt?.seconds ?? 0;
            return bTime - aTime;
          });
        setProducts(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter((p) => {
    // Sembunyikan barang yang sudah terjual
    if (p.status === "sold") return false;

    const matchCategory =
      activeCategory === "Semua" ||
      p.category === activeCategory ||
      (activeCategory === "Pakaian" && p.category === "Pakaian");

    const matchSearch = p.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* AppBar */}
      {isSearchActive ? (
        <View style={[styles.appBar, { paddingTop: Math.max(insets.top + 8, 48) }]}>
          <TouchableOpacity
            onPress={() => {
              setIsSearchActive(false);
              setSearchQuery("");
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#44474e"
              style={{ marginRight: 12 }}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama barang..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#74777f" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.appBar, { paddingTop: Math.max(insets.top + 8, 48) }]}>
          <View style={styles.appBarTextContainer}>
            <Text style={styles.appBarTitle}>Marketplace ITK</Text>
            <Text style={styles.appBarSubtitle}>
              TEMPAT JUAL BELI BARANG KHUSUS MAHASISWA ITK
            </Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setIsSearchActive(true)}
          >
            <Ionicons name="search" size={22} color="#44474e" />
          </TouchableOpacity>
        </View>
      )}

      {/* Hero Banner */}
      <View style={styles.heroSection}>
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCotzwMVNSaHXryj0GUkLSBx4hYSpMHTOpJSgQThdbu2jC4eeHkvf4lhPeR0hPuV_i7qfe65JSZ_73OineymXVGhvdZ_SxYgjupXnFmAiVue5jEshVaRfrNwYfXJ81j4awUL5qstlWT9kpd4IAiafUvUA1GJxmIZ1_hmI8Dp_5Ca1-ZRjLysT4hEMTOmWYAMY-oGMYsd9MVqb9pG4PaFDlw97OZIQ886xblLIm9BZuPtVBMNg3RUU1lqXVBNI3CNNyehnuM9p73rF14",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>POPULER</Text>
            </View>
            <Text style={styles.heroTitle}>Perlengkapan Wisuda</Text>
            <Text style={styles.heroSubtitle}>
              Koleksi buket dan toga terbaik untuk harimu.
            </Text>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Kategori</Text>
          <TouchableOpacity>
            <Text style={styles.categoriesLink}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBtn,
                activeCategory === cat && styles.categoryBtnActive,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryBtnText,
                  activeCategory === cat && styles.categoryBtnTextActive,
                ]}
              >
                {cat === "Pakaian" ? "Fashion" : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>Produk Terbaru</Text>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const initial = item.sellerName
      ? item.sellerName.charAt(0).toUpperCase()
      : "?";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageBase64 }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.productPrice}>
            Rp {item.price.toLocaleString("id-ID")}
          </Text>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{initial}</Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.sellerName}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={60} color="#c4c6cf" />
      <Text style={styles.emptyTitle}>Belum Ada Produk</Text>
      <Text style={styles.emptySubtitle}>
        Pilih kategori lain atau tunggu produk baru.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Memuat produk...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader()}
          contentContainerStyle={[
            styles.listContainer,
            filteredProducts.length === 0 && { flexGrow: 1 },
          ]}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#74777f",
  },
  listContainer: {
    paddingBottom: 30,
  },
  headerWrapper: {
    paddingBottom: 16,
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(196, 198, 207, 0.3)",
  },
  appBarTextContainer: {
    flexDirection: "column",
    flex: 1,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    letterSpacing: -0.5,
  },
  appBarSubtitle: {
    fontSize: 10,
    color: "#44474e",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff4ff",
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#eff4ff",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#1a1c1e",
    marginRight: 8,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroContainer: {
    width: "100%",
    aspectRatio: 2.1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#cbdbf5",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  heroBadge: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  heroBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  categoriesSection: {
    paddingVertical: 16,
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1c1e",
  },
  categoriesLink: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(196, 198, 207, 0.5)",
  },
  categoryBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#44474e",
  },
  categoryBtnTextActive: {
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1c1e",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(196, 198, 207, 0.3)",
    flexDirection: "column",
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#eff4ff",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productBadgeText: {
    color: "#2563eb",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cardContent: {
    padding: 12,
    flex: 1,
    flexDirection: "column",
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1c1e",
    marginBottom: 4,
    height: 40, // forces 2 lines height consistency
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 12,
    marginTop: "auto",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(196, 198, 207, 0.2)",
    gap: 8,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#cbdbf5",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
  },
  sellerName: {
    fontSize: 10,
    color: "#44474e",
    fontWeight: "500",
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#44474e",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#74777f",
    marginTop: 4,
  },
});
