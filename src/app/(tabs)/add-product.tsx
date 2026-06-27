import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = [
  "Buku",
  "Elektronik",
  "Jasa",
  "Makanan",
  "Pakaian",
  "Kos & Kontrakan",
  "Mainan",
  "Lainnya",
];
const CONDITIONS = ["Baru", "Bekas"];

// Warna tema sesuai desain HTML
const COLORS = {
  primary: "#004ac6",
  primaryContainer: "#2563eb",
  surface: "#f8f9ff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainer: "#e5eeff",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#434655",
  outline: "#737686",
  outlineVariant: "#c3c6d7",
  white: "#ffffff",
  error: "#ba1a1a",
};

export default function AddProductScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("Baru");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [includeLocation, setIncludeLocation] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Pilih foto dari galeri
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (Platform.OS === "web") {
        window.alert(
          "Izin Diperlukan\n\nAplikasi membutuhkan izin akses galeri foto.",
        );
      } else {
        Alert.alert(
          "Izin Diperlukan",
          "Aplikasi membutuhkan izin akses galeri foto.",
        );
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setStock("");
    setDescription("");
    setCategory("");
    setCondition("Baru");
    setImageUri(null);
    setImageBase64(null);
    setIncludeLocation(false);
    setLocationName(null);
    setLocationCoords(null);
  };

  const handleToggleLocation = async (value: boolean) => {
    setIncludeLocation(value);
    if (value) {
      setIsLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (Platform.OS === "web") {
            window.alert("Izin akses lokasi dibutuhkan untuk fitur ini.");
          } else {
            Alert.alert(
              "Izin Ditolak",
              "Izin akses lokasi dibutuhkan untuk fitur ini.",
            );
          }
          setIncludeLocation(false);
          setIsLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocationCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const loc = reverseGeocode[0];
          const name = [loc.city, loc.region].filter(Boolean).join(", ");
          setLocationName(name || "Lokasi Ditemukan");
        } else {
          setLocationName("Lokasi Ditemukan");
        }
      } catch (error) {
        console.error("Error getting location", error);
        if (Platform.OS === "web") {
          window.alert("Gagal mendapatkan lokasi.");
        } else {
          Alert.alert("Error", "Gagal mendapatkan lokasi.");
        }
        setIncludeLocation(false);
        setLocationName(null);
        setLocationCoords(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setLocationCoords(null);
      setLocationName(null);
    }
  };

  const handleSubmit = async () => {
    if (!title || !price || !description || !category || !condition) {
      if (Platform.OS === "web") {
        window.alert(
          "Form Belum Lengkap\n\nMohon isi semua field yang diperlukan.",
        );
      } else {
        Alert.alert(
          "Form Belum Lengkap",
          "Mohon isi semua field yang diperlukan.",
        );
      }
      return;
    }
    if (!imageBase64) {
      if (Platform.OS === "web") {
        window.alert(
          "Foto Belum Ada\n\nMohon pilih foto produk terlebih dahulu.",
        );
      } else {
        Alert.alert(
          "Foto Belum Ada",
          "Mohon pilih foto produk terlebih dahulu.",
        );
      }
      return;
    }

    const priceNum = parseInt(price.replace(/\D/g, ""), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      if (Platform.OS === "web") {
        window.alert("Harga Tidak Valid\n\nMasukkan harga yang valid.");
      } else {
        Alert.alert("Harga Tidak Valid", "Masukkan harga yang valid.");
      }
      return;
    }

    const stockNum = stock ? parseInt(stock, 10) : 1;

    // Konfirmasi sebelum posting
    const doPost = async () => {
      setIsLoading(true);
      try {
        await addDoc(collection(db, "products"), {
          title: title.trim(),
          price: priceNum,
          stock: stockNum,
          description: description.trim(),
          category,
          condition,
          imageBase64: `data:image/jpeg;base64,${imageBase64}`,
          sellerId: user!.id,
          sellerName: user!.name,
          sellerPhone: user!.phone || "",
          sellerNim: user!.nim || "",
          sellerPhoto: user!.photoBase64 || null,
          location:
            includeLocation && locationCoords
              ? {
                  latitude: locationCoords.latitude,
                  longitude: locationCoords.longitude,
                  name: locationName,
                }
              : null,
          status: "active",
          createdAt: serverTimestamp(),
        });

        if (Platform.OS === "web") {
          window.alert(
            "Berhasil! 🎉\n\nProdukmu sudah diposting dan bisa dilihat oleh mahasiswa ITK lainnya.",
          );
          resetForm();
          router.replace("/(tabs)");
        } else {
          Alert.alert(
            "Berhasil! 🎉",
            "Produkmu sudah diposting dan bisa dilihat oleh mahasiswa ITK lainnya.",
            [
              {
                text: "OK",
                onPress: () => {
                  resetForm();
                  router.replace("/(tabs)");
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error("Error posting product:", error);
        if (Platform.OS === "web") {
          window.alert(
            "Gagal Posting\n\nTerjadi kesalahan. Silakan coba lagi.",
          );
        } else {
          Alert.alert("Gagal Posting", "Terjadi kesalahan. Silakan coba lagi.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Konfirmasi Posting\n\nApakah Anda yakin ingin memposting barang ini?",
      );
      if (confirmed) doPost();
    } else {
      Alert.alert(
        "Konfirmasi Posting",
        "Apakah Anda yakin ingin memposting barang ini?",
        [
          { text: "Batal", style: "cancel" },
          { text: "Post Barang", onPress: doPost },
        ],
      );
    }
  };

  // Format harga dengan pemisah ribuan
  const handlePriceChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    const formatted = digits
      ? parseInt(digits, 10).toLocaleString("id-ID")
      : "";
    setPrice(formatted);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.unauthContainer}>
          <View style={styles.unauthIconWrapper}>
            <Ionicons name="cart-outline" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.unauthTitle}>Mulai Berjualan!</Text>
          <Text style={styles.unauthSubtitle}>
            Anda harus masuk atau mendaftar terlebih dahulu sebelum bisa menjual
            produk.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isFormValid =
    title && price && description && category && condition && imageBase64;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.appBar, { paddingTop: Math.max(insets.top + 12, 52) }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Jual Barang</Text>
          <Text style={styles.helpText}>Bantuan</Text>
        </View>

        {/* Foto Produk */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Foto Produk</Text>
            <Text style={styles.sectionHint}>Maks. 1 foto</Text>
          </View>
          <View style={styles.photoGrid}>
            {/* Tombol Tambah Foto */}
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={26} color={COLORS.primary} />
              <Text style={styles.addPhotoBtnText}>Tambah</Text>
            </TouchableOpacity>

            {/* Preview Foto */}
            {imageUri ? (
              <View style={styles.photoThumbnail}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.thumbnailImage}
                />
                <TouchableOpacity
                  style={styles.deletePhotoBtn}
                  onPress={() => {
                    setImageUri(null);
                    setImageBase64(null);
                  }}
                >
                  <Ionicons name="trash" size={12} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.photoThumbnail, styles.photoThumbnailEmpty]}>
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={COLORS.outlineVariant}
                />
              </View>
            )}

            {/* Placeholder slot kosong */}
            <View
              style={[
                styles.photoThumbnail,
                styles.photoThumbnailEmpty,
                { opacity: 0.4 },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color={COLORS.outlineVariant}
              />
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Nama Barang */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nama Barang</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Kalkulator Casio fx-991EX"
              placeholderTextColor={COLORS.outline}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Harga */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Harga</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor={COLORS.outline}
                keyboardType="numeric"
                value={price}
                onChangeText={handlePriceChange}
              />
            </View>
          </View>

          {/* Stok */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Stok Barang</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 1"
              placeholderTextColor={COLORS.outline}
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />
          </View>

          {/* Kategori */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kategori</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !category && styles.dropdownPlaceholder,
                ]}
              >
                {category || "Pilih Kategori"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.outline} />
            </TouchableOpacity>
          </View>

          {/* Kondisi — Toggle Chips */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kondisi</Text>
            <View style={styles.conditionRow}>
              {CONDITIONS.map((cond) => {
                const isActive = condition === cond;
                return (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.conditionChip,
                      isActive && styles.conditionChipActive,
                    ]}
                    onPress={() => setCondition(cond)}
                    activeOpacity={0.7}
                  >
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={COLORS.white}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.conditionChipText,
                        isActive && styles.conditionChipTextActive,
                      ]}
                    >
                      {cond}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Lokasi */}
          <View style={styles.formGroup}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={styles.label}>Tambahkan Lokasi Saat Ini</Text>
                {locationName && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.outline,
                      marginTop: 4,
                    }}
                  >
                    {locationName}
                  </Text>
                )}
              </View>
              <Switch
                value={includeLocation}
                onValueChange={handleToggleLocation}
                trackColor={{
                  false: COLORS.outlineVariant,
                  true: COLORS.primaryContainer,
                }}
                thumbColor={includeLocation ? COLORS.primary : COLORS.white}
              />
            </View>

            {includeLocation && locationCoords && (
              <View
                style={{
                  marginTop: 16,
                  height: 200,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onPress={async (e) => {
                    const coords = e.nativeEvent.coordinate;
                    setLocationCoords(coords);
                    try {
                      let reverseGeocode =
                        await Location.reverseGeocodeAsync(coords);
                      if (reverseGeocode.length > 0) {
                        const loc = reverseGeocode[0];
                        const name = [loc.city, loc.region]
                          .filter(Boolean)
                          .join(", ");
                        setLocationName(name || "Lokasi Dipilih");
                      } else {
                        setLocationName("Lokasi Dipilih");
                      }
                    } catch (error) {
                      console.log(
                        "Error reverse geocoding new location",
                        error,
                      );
                    }
                  }}
                >
                  <Marker coordinate={locationCoords} />
                </MapView>
                <Text
                  style={{ fontSize: 12, color: COLORS.outline, marginTop: 8 }}
                >
                  * Anda dapat menekan peta untuk menyesuaikan lokasi barang
                </Text>
              </View>
            )}
          </View>

          {/* Deskripsi */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Deskripsi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Jelaskan detail barang, kelengkapan, dan alasan dijual..."
              placeholderTextColor={COLORS.outline}
              multiline
              numberOfLines={5}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* Tombol Post */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Post Barang</Text>
                <Ionicons
                  name="send"
                  size={18}
                  color={COLORS.white}
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Kategori */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Kategori</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.modalOption,
                  category === cat && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    category === cat && styles.modalOptionTextSelected,
                  ]}
                >
                  {cat}
                </Text>
                {category === cat && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    paddingBottom: 60,
  },

  // AppBar
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainer,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
    letterSpacing: -0.4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.outline,
    letterSpacing: 0.1,
  },

  // Photo Grid
  photoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  addPhotoBtn: {
    width: 90,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoBtnText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    fontWeight: "500",
  },
  photoThumbnail: {
    width: 90,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  photoThumbnailEmpty: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  deletePhotoBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(186, 26, 26, 0.85)",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  // Form
  form: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    height: "100%",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  dropdownPlaceholder: {
    color: COLORS.outline,
  },

  // Condition Chips
  conditionRow: {
    flexDirection: "row",
    gap: 12,
  },
  conditionChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
  },
  conditionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  conditionChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  conditionChipTextActive: {
    color: COLORS.white,
  },

  // Submit Button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#a0b4e0",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: -0.2,
  },

  // Unauth Screen
  unauthContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.surface,
  },
  unauthIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  unauthTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  unauthSubtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
